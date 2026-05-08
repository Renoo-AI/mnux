'use client';

import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, doc, FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NetworkStatus {
  isOnline: boolean;
  isFirestoreConnected: boolean;
  lastChecked: Date | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isFirestoreConnected: true,
    lastChecked: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true, lastChecked: new Date() }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, lastChecked: new Date() }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

// Retry helper for Firestore operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a retryable error
      const firebaseError = error as { code?: string };
      const isRetryable = 
        firebaseError.code === 'unavailable' ||
        firebaseError.code === 'deadline-exceeded' ||
        firebaseError.code === 'resource-exhausted' ||
        (error as Error).message?.includes('offline');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
}

// Check if error is an offline error
export function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  
  const firebaseError = error as { code?: string; message?: string };
  
  return (
    firebaseError.code === 'unavailable' ||
    firebaseError.code === 'failed-precondition' ||
    firebaseError.message?.includes('offline') ||
    firebaseError.message?.includes('network') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
}

export default useNetworkStatus;
