import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menux.tn';

// Base metadata for restaurant pages
// Individual pages can override with dynamic metadata
export const metadata: Metadata = {
  title: {
    default: 'Restaurant Menu',
    template: '%s | MenuxPRO',
  },
  description: 'View the restaurant menu, order from your table, and follow your order status.',
  openGraph: {
    title: 'Restaurant Menu | MenuxPRO',
    description: 'View the restaurant menu, order from your table, and follow your order status.',
    type: 'website',
    url: siteUrl,
    images: [
      {
        url: '/og/menuxpro-square.png',
        width: 1024,
        height: 1024,
        alt: 'MenuxPRO - Restaurant Menu',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Restaurant Menu | MenuxPRO',
    description: 'View the restaurant menu, order from your table, and follow your order status.',
    images: ['/og/menuxpro-square.png'],
  },
};

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
