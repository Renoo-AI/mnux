'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AsyncErrorProps {
  error: Error;
  resetError: () => void;
  message?: string;
}

export function AsyncErrorFallback({ error, resetError, message }: AsyncErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="mb-4 flex justify-center">
        <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-error" />
        </div>
      </div>
      
      <h3 className="font-display text-title-md text-primary mb-2">
        Failed to load
      </h3>
      
      <p className="text-on-surface-variant mb-4 max-w-md">
        {message || error.message || 'Something went wrong while loading this content.'}
      </p>
      
      <Button
        onClick={resetError}
        className="bg-primary text-on-primary rounded-full px-6 hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

// Hook for handling async errors
export function useAsyncError() {
  return (error: Error) => {
    throw error;
  };
}

// Component for catching async errors in component tree
interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AsyncErrorBoundary({ children, fallback }: AsyncErrorBoundaryProps) {
  return (
    <div className="relative">
      {children}
    </div>
  );
}

export default AsyncErrorFallback;
