import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./luxury.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://menux.tn";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFBF9" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1A17" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  
  // Title configuration
  title: {
    default: "MenuxPRO — Smart Restaurant Experience OS",
    template: "%s | MenuxPRO",
  },
  
  // Description
  description: "MenuxPRO helps cafés and restaurants create premium QR menus, receive table orders, manage cashier and waiter flows, collect reviews, and build customer loyalty.",
  
  // Keywords
  keywords: [
    "QR menu Tunisia",
    "menu digital Tunisie",
    "menu QR restaurant",
    "restaurant ordering system",
    "café menu QR",
    "digital menu Qatar",
    "restaurant OS",
    "waiter request system",
    "cashier dashboard restaurant",
    "MenuxPRO",
    "digital menu",
    "table ordering",
    "restaurant technology",
  ],
  
  // Authors
  authors: [{ name: "MenuxPRO Team" }],
  
  // Creator and publisher
  creator: "MenuxPRO",
  publisher: "MenuxPRO",
  
  // Robots default (can be overridden per page)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/brand/menuxpro-mark.svg", color: "#3A322D" },
    ],
  },
  
  // Manifest
  manifest: "/site.webmanifest",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "fr_TN",
    alternateLocale: ["ar_TN", "en_US", "fr_QA", "ar_QA"],
    url: siteUrl,
    siteName: "MenuxPRO",
    title: "MenuxPRO — Smart Restaurant Experience OS",
    description: "Premium QR menu, ordering, cashier flow, waiter requests, loyalty, and reviews for cafés and restaurants in Tunisia and Qatar.",
    images: [
      {
        url: "/og/menuxpro-og.png",
        width: 1344,
        height: 768,
        alt: "MenuxPRO - Smart Restaurant Experience OS",
        type: "image/png",
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "MenuxPRO — Smart Restaurant Experience OS",
    description: "Premium QR menu, ordering, cashier flow, waiter requests, loyalty, and reviews for cafés and restaurants.",
    images: ["/og/menuxpro-twitter.png"],
    creator: "@menuxpro",
  },
  
  // Verification (placeholder - user should add actual verification codes)
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  
  // Category
  category: "technology",
  
  // Classification
  classification: "Restaurant Software",
  
  // Application info
  applicationName: "MenuxPRO",
  
  // Apple web app
  appleWebApp: {
    capable: true,
    title: "MenuxPRO",
    statusBarStyle: "default",
  },
  
  // Format detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  
  // Other meta
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: "MenuxPRO",
                  url: siteUrl,
                  logo: {
                    "@type": "ImageObject",
                    url: `${siteUrl}/brand/menuxpro-logo.svg`,
                    width: 240,
                    height: 64,
                  },
                  sameAs: [
                    "https://twitter.com/menuxpro",
                    // Add other social profiles when available
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  url: siteUrl,
                  name: "MenuxPRO",
                  description: "Smart Restaurant Experience OS for cafés and restaurants.",
                  publisher: {
                    "@id": `${siteUrl}/#organization`,
                  },
                  inLanguage: ["fr", "ar", "en"],
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": `${siteUrl}/#software`,
                  name: "MenuxPRO",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  description: "Premium QR menu, ordering, cashier flow, waiter requests, loyalty, and reviews for cafés and restaurants.",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    description: "Free tier available with premium features",
                  },
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "4.8",
                    ratingCount: "150",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${playfairDisplay.variable} ${plusJakartaSans.variable} antialiased bg-[#faf9f6] text-[#2d2a26] font-sans`}>
        {children}
      </body>
    </html>
  );
}
