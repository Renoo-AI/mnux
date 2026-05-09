'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, UtensilsCrossed, QrCode } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-4 bg-background/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-headline-md font-bold text-primary">Menux</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="max-w-md text-center">
          {/* 404 Illustration */}
          <div className="relative mb-8">
            <div className="text-[120px] md:text-[180px] font-display font-bold text-surface-container leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-surface-container-lowest rounded-full p-6 shadow-card">
                <UtensilsCrossed className="w-16 h-16 md:w-20 md:h-20 text-secondary" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="font-display text-headline-md text-primary mb-4">
            Oops! This table is empty
          </h1>
          <p className="text-on-surface-variant text-lg mb-8">
            The page you&apos;re looking for seems to have been cleared. 
            Let us guide you back to the menu.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-on-primary hover:opacity-90">
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-outline hover:bg-surface-container-low">
              <Link href="/r/demo">
                <QrCode className="w-5 h-5 mr-2" />
                View Demo Menu
              </Link>
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none" />
      </main>

      {/* Footer */}
      <footer className="w-full px-8 py-6 text-center border-t border-outline-variant">
        <p className="text-on-surface-variant text-label-sm">
          © 2024 Menux. The art of digital hospitality.
        </p>
      </footer>
    </div>
  );
}
