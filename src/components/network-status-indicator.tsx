'use client';

import { useEffect, useState } from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffSession } from '@/contexts/StaffSessionContext';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);
  const { isOffline } = useStaffSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showOffline = !isOnline || isOffline;

  return (
    <AnimatePresence>
      {showOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          <span>You&apos;re offline. Some features may be unavailable.</span>
        </motion.div>
      )}
      
      {showReconnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-green-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FirestoreOfflineIndicator() {
  const { isOffline } = useStaffSession();

  if (!isOffline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-sm text-amber-800"
    >
      <CloudOff className="w-5 h-5 text-amber-500 shrink-0" />
      <div>
        <p className="font-medium">Connection issue</p>
        <p className="text-amber-600 text-xs">Some data may be temporarily unavailable. We&apos;ll reconnect automatically.</p>
      </div>
    </motion.div>
  );
}

export default NetworkStatusIndicator;
