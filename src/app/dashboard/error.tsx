'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center animate-scale-up">
              <AlertTriangle className="w-10 h-10 text-error" />
            </div>
          </div>
          
          <h1 className="font-display text-headline-md text-primary mb-2">
            Something went wrong
          </h1>
          
          <p className="text-on-surface-variant mb-6">
            We encountered an error while loading this page. Please try again or navigate to a different section.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-surface-container-low rounded-xl text-left overflow-auto max-h-40">
              <p className="text-error font-mono text-sm whitespace-pre-wrap">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-primary text-on-primary rounded-full px-6 hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="border border-outline-variant text-primary rounded-full px-6 hover:bg-surface-container-low"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="border border-outline-variant text-primary rounded-full px-6 hover:bg-surface-container-low"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
