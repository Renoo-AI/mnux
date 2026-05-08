import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";

// Menux Brand Fonts
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FCFBF9",
};

export const metadata: Metadata = {
  title: "Menux - Premium Digital Menu & Table Ordering",
  description: "QR menus and table ordering designed for modern cafés and restaurants. Transform your service with elegant digital menus.",
  keywords: ["Menux", "restaurant", "digital menu", "QR code", "table ordering", "café", "food service"],
  authors: [{ name: "Menux Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Menux - Premium Digital Menu",
    description: "Transform your restaurant with elegant digital menus",
    type: "website",
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
        {/* Material Symbols Font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`${playfairDisplay.variable} ${plusJakartaSans.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
