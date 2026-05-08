import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }
  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'menuxtn',
  });
  return adminApp;
}

async function verifySuperAdmin(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const idToken = authHeader.substring(7);
  const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID || 'rjAbnlO0deNZRavuHgfBsxRZTVY2';
  
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.uid !== SUPERADMIN_UID) return null;
    return { uid: decodedToken.uid };
  } catch {
    return null;
  }
}

function sanitizeText(text: string, maxLength: number = 200): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').slice(0, maxLength);
}

// POST - Bulk import menu items
export async function POST(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { restaurantId, items } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Limit to 500 items per batch
    const limitedItems = items.slice(0, 500);

    const app = getAdminApp();
    const db = getFirestore(app);

    // Verify restaurant exists
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Validate and sanitize items
    const validatedItems = limitedItems.map((item, index) => {
      const price = parseFloat(item.price);
      
      return {
        category: sanitizeText(item.category || 'Uncategorized', 50),
        name: sanitizeText(item.name || item.nameFr || `Item ${index + 1}`, 100),
        nameFr: sanitizeText(item.nameFr || item.name || '', 100),
        nameAr: item.nameAr ? sanitizeText(item.nameAr, 100) : '',
        description: item.description ? sanitizeText(item.description, 500) : '',
        price: isNaN(price) ? 0 : Math.max(0, Math.min(100000, price)),
        available: item.available !== false,
        featured: item.featured === true,
        imageUrl: item.imageUrl ? sanitizeText(item.imageUrl, 500) : '',
        allergens: Array.isArray(item.allergens) ? item.allergens.slice(0, 20) : [],
        createdAt: Date.now(),
        createdBy: user.uid,
      };
    });

    // Batch write
    const batch = db.batch();
    const itemsRef = db.collection(`restaurants/${restaurantId}/items`);

    validatedItems.forEach((item) => {
      const docRef = itemsRef.doc();
      batch.set(docRef, item);
    });

    await batch.commit();

    // Log the action
    await db.collection('system_logs').add({
      type: 'BULK_IMPORT',
      message: `Bulk imported ${validatedItems.length} items to restaurant ${restaurantId}`,
      details: { 
        restaurantId, 
        itemCount: validatedItems.length,
        categories: [...new Set(validatedItems.map(i => i.category))]
      },
      timestamp: Date.now(),
      adminUid: user.uid,
    });

    return NextResponse.json({ 
      success: true, 
      importedCount: validatedItems.length,
      message: `Successfully imported ${validatedItems.length} items`
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}
