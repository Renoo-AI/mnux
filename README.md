# MenuxPRO

A modern restaurant management system built with Next.js, Firebase, and Prisma.

## Features

- **Menu Management** - Create and manage restaurant menus with categories, items, and customizations
- **Table Management** - Digital table management with QR codes for customer ordering
- **Order System** - Real-time order processing for kitchen and service staff
- **Staff Management** - Role-based access for waiters, kitchen staff, and administrators
- **Customer Experience** - Mobile-optimized customer interface for browsing menus and placing orders
- **Feedback System** - Customer feedback collection and analytics
- **Branding** - Customizable restaurant branding with logo and theme colors
- **Security** - Built-in security features including rate limiting and honeypot protection
- **Premium UI** - Luxury hospitality design with gold accents and premium animations

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Cloud Functions)
- **Database**: Prisma ORM with SQLite (local development)
- **Deployment**: Vercel (frontend), Firebase Hosting (functions)

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm/yarn/pnpm
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Firebase configuration.

4. Initialize Firebase:
   - Create a Firebase project
   - Enable Firestore and Authentication
   - Get your Firebase config credentials

5. Run the development server:
   ```bash
   bun run dev
   ```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── dashboard/         # Restaurant owner dashboard
│   ├── r/                # Public restaurant pages
│   └── staff/            # Staff interface
├── components/            # React components
├── hooks/                # Custom React hooks
├── lib/                   # Utility functions
├── services/              # Business logic services
├── stores/                # State management
└── types/                 # TypeScript type definitions
```

## Deployment

See `FIREBASE_EXPORT_CONFIG.md` for detailed Firebase deployment instructions.

## License

Private project - All rights reserved
