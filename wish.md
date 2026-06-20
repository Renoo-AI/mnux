# MenuX - Complete Rebuild Prompts

Here is the master compilation of all the prompts, architecture logic, and feature specifications used to build this project. You can copy and paste these sequentially into any AI coding assistant to perfectly rebuild the entire application from scratch.

---

## 🟢 PROMPT 1: Initial Project Setup & Core Requirements

**Copy and paste this first to establish the foundation, routing, and public menu.**

```text
Build a complete restaurant menu web application using Next.js (App Router), Tailwind CSS, and Firebase (Firestore, Authentication, Hosting). The app must include all features below.

1. Project Structure
Create dynamic routing for the public menu: `app/[storeId]/menu/page.tsx`
Create admin routes: `app/admin/login`, `app/admin/dashboard`
Create super admin routes: `app/super/login`, `app/super/dashboard`

2. Public Menu Page (`app/[storeId]/menu/page.tsx`)
- Extract storeId from URL params.
- Fetch store data and menu items from Firestore.
- Display grouped by category.
- Add language toggle (FR/AR) with RTL/LTR switching.
- Add shimmer loading effect.

3. Path Obfuscation (Randomized URLs)
- Create `lib/paths-config.ts` exporting random strings for adminLogin, adminDashboard, superLogin, superDashboard.
- Create `middleware.ts` that checks if the path matches the random paths and uses `NextResponse.rewrite` to map them to the actual `/admin` and `/super` routes.

4. Rate Limiting + Ban/Kick
- Create `lib/rateLimit.ts` to track failed login attempts per IP in Firestore collection `failed_attempts`.
- After 5 attempts → kick (15 min ban) → add to `banned_ips` collection.
- After 10 attempts → permanent ban.
- Middleware must check if IP is banned before allowing access to admin/super routes.

5. Firestore Security Rules
- Public read for `stores` and `menu_items`.
- Admin write only to their own store's `menu_items`.
- Super admin full access to all collections.
- Banned IPs readable by super admin only.
```

---

## 🟢 PROMPT 2: Design System - "Frosted Glass" Theme

**Copy and paste this next to apply the UI styling.**

```text
Apply the "Frosted Glass" design theme to the app. 
Update `app/globals.css` with the following styling, preserving all existing Next.js layout and HTML logic. Make sure to use Tailwind CSS utility classes where possible, but add these core CSS variables and custom classes to globals.css:

@import "tailwindcss";

:root {
  --bg: #faf9f6;
  --surface: #ffffff;
  --accent: #b48c68;
  --text: #2d2a26;
  --text-dim: #71717a;
}
body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: var(--bg);
  color: var(--text);
  margin: 0;
}
html[lang="ar"] body {
  font-family: 'Noto Sans Arabic', sans-serif;
}
.serif {
  font-family: Georgia, 'Times New Roman', serif;
}
.menu-card {
  background: var(--surface);
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(180, 140, 104, 0.08);
}
.glass-nav {
  background: rgba(250, 249, 246, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(180, 140, 104, 0.15);
}
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0,0,0,0.03);
}
.item-price {
  color: var(--accent);
  font-weight: 800;
  white-space: nowrap;
}
.category-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.category-line {
  height: 1px;
  flex-grow: 1;
  background: linear-gradient(to right, var(--accent), transparent);
  opacity: 0.4;
}
```

---

## 🟢 PROMPT 3: Database Architecture Context 

**Feed this into the AI context window so it perfectly understands how the data connects.**

```text
Database Architecture Guidelines (Firestore):
- `stores` collection: Fields mapping to `name`, `description`. Used to display the restaurant info. Document ID is the store slug (e.g., cafe-123).
- `menu_items` collection: Flat structure. Fields: `store_id`, `name`, `description`, `price`, `category`, `available`.
- `user_roles` collection: Security bridging table. Document ID matches the Firebase Auth uid. Fields: `role` ('admin' or 'super_admin'), `store_id` (only if role is admin).
- `failed_attempts` collection: Tracks failed logins per IP over time.
- `banned_ips` collection: If failed logins exceed limits, IP is moved here. Fields: `level` ("15_min" or "permanent"), `bannedUntil` (timestamp).

Relationships:
- When querying `menu_items`, always filter by `where('store_id', '==', storeId)`.
- When verifying Admin access, always verify their Firebase user `uid` exists in `user_roles` with `role: "admin"`. They can ONLY edit menu items where the item's `store_id` matches their user role's `store_id`.
```

---

## 🟢 PROMPT 4: Admin & Super Admin Implementation

**Run this final prompt to build out the secured dashboards.**

```text
Implement the Admin and Super Admin dashboards acting as an expert Next.js and Firebase developer.

1. Global Security
- Wrap `app/admin/dashboard/page.tsx` and `app/super/dashboard/page.tsx` in authentication guards. Redirect unauthenticated users to login.
- Fetch user role from `/user_roles/{userId}`. Immediately redirect or throw an unauthorized error if the role does not match the required portal (admin vs super_admin).

2. Admin Dashboard
- Retrieve the `store_id` assigned to the logged-in admin from `user_roles`.
- Menu Management (CRUD): Fetch documents from `menu_items` where `store_id` equals the admin's `store_id`.
- Provide forms to Create, Update, and Delete items. Include a toggle for the `available` boolean.

3. Super Admin Dashboard
- Organize into 3 sections: Stores, Admins, and Banned IPs.
- Store Management: Fetch all `stores`. Form to create a new store.
- Admin Management: Fetch all users from `user_roles` where `role == 'admin'`. Display their user ID and `store_id`.
- Security Management: Query `banned_ips`. Display IP, ban level, and expiration. Provide a "Revoke Ban" button to delete the ban document.

4. UI Requirements
- Use the `.menu-card` and `.glass-nav` Tailwind classes from `globals.css`.
- Add toast notifications or simple alert states for CRUD operations.
- Ensure the layout is a clean, max-width centered workspace (e.g., `max-w-5xl mx-auto`).
```

---

## Current Supabase Migration File

Located at: `supabase_migration.sql`

Contains the complete database schema with:
- `restaurants` (stores)
- `categories`
- `items` (menu_items)
- `tables`
- `orders`
- `activity_logs`
- `staff` (user_roles mapping)
- `table_requests`
- `banned_ips`
- `failed_attempts`

Full RLS policies on all tables.

---

## Currently Built Pages

| Route | Role | Status |
|-------|------|--------|
| `/` | Public | Landing page |
| `/r/[slug]/t/[tableId]` | Customer | Public menu + ordering |
| `/r/[slug]/t/[tableId]/review` | Customer | Order review |
| `/r/[slug]/t/[tableId]/sent` | Customer | Order confirmation |
| `/dashboard` | Owner | Auth + menu CRUD |
| `/dashboard/tables` | Owner | Table management + QR |
| `/dashboard/cashier` | Cashier | Active orders |
| `/admin/dashboard` | Admin | Store-specific menu CRUD |
| `/super/dashboard` | Superadmin | Platform control (stores/admins/banned) |
| `/superadmin` | Superadmin | Platform overview |

---

## API Routes (Supabase)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/menu` | GET/POST/PATCH/DELETE | Menu item CRUD |
| `/api/public/restaurant/[slug]` | GET | Public restaurant + menu |
| `/api/public/orders` | POST | Customer order submission |
| `/api/tables` | GET/POST/PATCH/DELETE | Table CRUD |
| `/api/staff/login` | POST | Staff PIN verification |
| `/api/logs` | GET/POST | Activity logs |
| `/api/superadmin` | GET/PATCH | Platform admin operations |

---

## Design System

- Background: `#faf9f6` (warm cream)
- Text: `#2d2a26` (espresso)
- Accent: `#b48c68` (caramel)
- Cards: white, soft shadow, rounded-2xl
- Nav: glass/frosted effect
- Fonts: Playfair Display (serif), Plus Jakarta Sans (body), Noto Sans Arabic (Arabic)

---

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_RESTAURANT_ID=
```
