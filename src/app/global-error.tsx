'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-error-container rounded-full flex items-center justify-center animate-scale-up">
                <AlertTriangle className="w-12 h-12 text-error" />
              </div>
            </div>
            
            <h1 className="font-display text-display-sm text-primary mb-3">
              Something went wrong
            </h1>
            
            <p className="text-on-surface-variant mb-8 text-lg">
              We&apos;re sorry, but an unexpected error occurred. Our team has been notified and we&apos;re working to fix it.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-surface-container-low rounded-xl text-left overflow-auto max-h-48">
                <p className="text-error font-mono text-sm whitespace-pre-wrap">
                  {error.message}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={reset}
                className="bg-primary text-on-primary rounded-full px-8 py-4 text-lg hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-2 border-primary text-primary rounded-full px-8 py-4 text-lg hover:bg-surface-container-low"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
