# MenuxPro - AI Coding Prompt

You are working on **MenuxPro**, a premium QR menu + table ordering system for cafés and restaurants.

## Stack (FINAL)
- **Framework:** Next.js 16 App Router (Turbopack)
- **Database:** Supabase PostgreSQL (auth + data + realtime)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** Zustand (cart store) + React hooks
- **Deploy:** Vercel
- **NO FIREBASE.** Zero Firebase imports. Everything is Supabase.

## Design System
- Background: `#faf9f6` (warm cream)
- Text: `#2d2a26` (espresso)
- Accent: `#b48c68` (caramel)
- Cards: white, `rounded-[20px]`, `shadow-[0_10px_30px_rgba(58,50,45,0.05)]`
- Fonts: Playfair Display (headings) + Plus Jakarta Sans (body)
- Glass nav: `bg-white/80 backdrop-blur-md`
- Buttons: `rounded-full`, black or accent
- No gradients, no dark mode, no excessive animation

## Database Schema
Tables: `restaurants`, `categories`, `items`, `tables`, `orders`, `activity_logs`, `staff`, `table_requests`, `banned_ips`, `failed_attempts`

All reference `auth.users(id)` via UUID foreign keys. Full RLS policies: deny-by-default, multi-tenant isolation, public can only read ACTIVE restaurants + available items.

Schema file: `schema.txt` or `supabase_migration.sql`

## Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Design tokens + utilities
│   ├── login/page.tsx          # Auth (login/signup)
│   ├── dashboard/
│   │   ├── page.tsx            # Owner dashboard (menu CRUD)
│   │   ├── cashier/page.tsx    # Cashier dashboard (orders)
│   │   ├── tables/page.tsx     # Table management + QR
│   │   ├── menu/page.tsx       # Menu viewer
│   │   └── settings/page.tsx   # Settings
│   ├── admin/dashboard/        # Admin (store-specific CRUD)
│   ├── super/dashboard/        # Superadmin (platform control)
│   ├── superadmin/page.tsx     # Superadmin overview
│   ├── r/[slug]/page.tsx       # Public menu (no table)
│   └── r/[slug]/t/[tableId]/  # Public table ordering
│       ├── page.tsx            # Menu + cart
│       ├── review/page.tsx     # Order review
│       └── sent/page.tsx       # Order confirmation
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── order/                  # Order-related components
├── lib/
│   ├── supabase/browser.ts     # Browser Supabase client
│   ├── supabase/admin.ts       # Server admin client
│   └── useAuth.ts              # Auth hook (Supabase session + role check)
├── stores/
│   └── cartStore.ts            # Zustand cart (sessionStorage persisted)
├── api/                        # API routes (all use Supabase admin client)
│   ├── menu/route.ts           # Menu CRUD
│   ├── tables/route.ts         # Table CRUD
│   ├── logs/route.ts           # Activity logs
│   ├── staff/login/route.ts    # Staff PIN verification
│   ├── superadmin/route.ts     # Platform admin
│   └── public/
│       ├── orders/route.ts     # Customer order submission
│       └── restaurant/[slug]/route.ts  # Public restaurant data
└── types/
    └── index.ts                # All TypeScript types
```

## Key Files & What They Do

### Auth Flow
- `src/lib/supabase/browser.ts` - Browser Supabase client with `persistSession: true`
- `src/lib/useAuth.ts` - `useAuth(requiredRole?)` hook. Checks auth session, then queries `staff` table for role + restaurant assignment. Returns `{ user, staff, loading, signOut }`.
- `src/app/login/page.tsx` - Split-panel login. Left: café image + branding. Right: email/password form. Toggle login/signup. On signup, auto-creates restaurant + staff record.

### Owner Dashboard
- `src/app/dashboard/page.tsx` - Full menu CRUD. Cards with FR/AR names, prices. Edit/delete buttons. Modal for add/edit. "Restore Defaults" seeds ZCOFFEE menu. Uses `/api/menu` for all operations.

### Cashier Dashboard
- `src/app/dashboard/cashier/page.tsx` - Active orders grid. Amber=NEW, Green=ACCEPTED, Blue=PAID. Right panel shows order detail. Action buttons: Accept, Mark Paid, Close, Cancel (with reason).

### Public Ordering
- `src/app/r/[slug]/t/[tableId]/page.tsx` - Customer scans QR. Fetches from `/api/public/restaurant/[slug]`. Falls back to demo ZCOFFEE menu. Category tabs, add to cart, sticky cart bar.
- `src/app/r/[slug]/t/[tableId]/review/page.tsx` - Cart review. Posts order to `/api/public/orders`.

### Superadmin
- `src/app/superadmin/page.tsx` - Login → staff table role check → list all restaurants → suspend/activate → upgrade/downgrade plans.
- `src/app/super/dashboard/page.tsx` - 3 tabs: Stores, Admins, Banned IPs. Full CRUD for each.

### API Routes (all use server-side Supabase admin client)
- `POST /api/public/orders` - Validates restaurant active, table available, no duplicate active order, calculates total server-side, creates order + activity log.
- `PATCH /api/public/orders` - Updates order status, records timestamps, creates activity log.
- `GET /api/menu?restaurantId=` - Returns items with joined categories.
- `POST/PATCH/DELETE /api/menu` - CRUD with auto-category creation.
- `GET/POST/PATCH/DELETE /api/tables` - Table CRUD with QR token generation.

## Order State Machine
```
CREATED → ACCEPTED → PAID → CLOSED
CREATED → CANCELLED
ACCEPTED → CANCELLED
```
Every transition writes an immutable activity log.

## Color Map (from mocks)
| Token | Hex |
|-------|-----|
| Warm cream bg | `#FDF8F3` or `#faf9f6` |
| Espresso text | `#3D2C1E` or `#2d2a26` |
| Caramel accent | `#D4A373` or `#b48c68` |
| Card white | `#FFFFFF` |
| Borders | `#E8E2DA` or `rgba(0,0,0,0.05)` |
| Muted text | `#7f756f` or `#71717a` |
| New order | Amber `#F59E0B` |
| Accepted | Emerald `#10B981` |
| Paid | Blue `#3B82F6` |

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_RESTAURANT_ID=uuid-here
```

## Rules for Building
1. **Supabase only.** No Firebase imports. No Firestore. No Firebase Auth.
2. **Match the mocks.** Design must feel like a calm premium café OS, not a generic SaaS dashboard.
3. **Bilingual FR/AR.** Every page must support French + Arabic with RTL/LTR switching.
4. **Mobile-first.** All pages must work on phones (café customers scan QR on mobile).
5. **Cashier = rush tool.** Big buttons, clear colors, no clutter, no analytics on cashier screen.
6. **Owner = calm trust.** Clean logs, simple summaries, no surveillance vibes.
7. **Customer = zero friction.** No login, no account, no app install. Scan → order → done.
8. **Server validates everything.** Never trust client prices, totals, or role checks.
9. **Activity logs are append-only.** Never allow client-side edits or deletes.
10. **Plan limits enforced server-side.** Free plan: watermark, 8 items max, random slug. Pro: unlimited.

## Common Tasks
- **Add new page:** Create `app/route/page.tsx` with `'use client'`, import `useAuth('role')` for protected pages.
- **Add API route:** Create `app/api/name/route.ts`, use `createAdminClient()` from `lib/supabase/admin.ts`.
- **Fetch data:** For public data, fetch from `/api/public/...`. For admin data, fetch from `/api/menu`, `/api/tables`, etc. All use Supabase under the hood.
- **Auth check:** `useAuth()` hook auto-checks session + staff role. Returns `{ user, staff, loading }`.
- **Cart:** Import `useCartStore` from `stores/cartStore.ts`. `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`.

## Deploy
- Push to `main` on GitHub → Vercel auto-deploys to `https://mnuxpro.vercel.app`
- Repo: `https://github.com/Renoo-AI/mnux`
- Old repo: `https://github.com/Renoo-AI/Menux`

## The Core Promise
"MenuxPro works alongside the existing caisse. It does not replace it."
Customers scan QR → order appears on cashier dashboard → cashier accepts → customer pays at real caisse → cashier marks paid → closes table.
