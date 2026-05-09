'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db, SUPERADMIN_UID } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ShieldAlert, Mail, Lock, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isOfflineError, withRetry } from '@/hooks/useNetworkStatus';

export default function AdminLoginPage() {
  const router = useRouter();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  const authStateProcessed = useRef(false);

  // Check if already logged in as superadmin
  useEffect(() => {
    if (authStateProcessed.current) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (authStateProcessed.current) return;
      authStateProcessed.current = true;
      
      if (user && user.uid === SUPERADMIN_UID) {
        router.replace('/admin');
      } else {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const logLoginAttempt = async (type: 'GOOGLE' | 'EMAIL', userId: string, email: string, success: boolean) => {
    try {
      await withRetry(() => addDoc(collection(db, 'system_logs'), {
        type: success ? 'ADMIN_LOGIN_SUCCESS' : 'ADMIN_LOGIN_FAILED',
        message: `${type} login attempt: ${email}`,
        details: { 
          userId, 
          email, 
          success,
          timestamp: Date.now(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        },
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Failed to log login attempt:', err);
      // Fail silently - don't block login for logging failures
    }
  };

  const handleGoogleLogin = async () => {
    if (!isOnline) {
      setError('You appear to be offline. Please check your connection and try again.');
      return;
    }
    
    try {
      setGoogleLoading(true);
      setError('');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user is superadmin
      if (result.user.uid !== SUPERADMIN_UID) {
        await logLoginAttempt('GOOGLE', result.user.uid, result.user.email || '', false);
        await signOut(auth);
        setError('Access denied. Only authorized administrators can access this panel.');
        setGoogleLoading(false);
        return;
      }
      
      await logLoginAttempt('GOOGLE', result.user.uid, result.user.email || '', true);
      router.replace('/admin');
      
    } catch (err: any) {
      console.error('Google login error:', err);
      
      if (isOfflineError(err)) {
        setError('Connection issue. Please check your internet and try again.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups or try email login.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Authentication failed');
      }
      
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('You appear to be offline. Please check your connection and try again.');
      return;
    }
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is superadmin
      if (result.user.uid !== SUPERADMIN_UID) {
        await logLoginAttempt('EMAIL', result.user.uid, result.user.email || '', false);
        await signOut(auth);
        setError('Access denied. Only authorized administrators can access this panel.');
        setLoading(false);
        return;
      }
      
      await logLoginAttempt('EMAIL', result.user.uid, result.user.email || '', true);
      router.replace('/admin');
      
    } catch (err: any) {
      console.error('Email login error:', err);
      
      if (isOfflineError(err) || err.code === 'auth/network-request-failed') {
        setError('Connection issue. Please check your internet and try again.');
      } else {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('Invalid email or password.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Account temporarily locked.');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address format.');
            break;
          default:
            setError(err.message || 'Authentication failed');
        }
      }
      
      setLoading(false);
    }
  };

  // Loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-espresso mx-auto mb-4 animate-pulse" />
          <p className="text-on-surface-variant font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 sm:p-6 bg-surface">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>You&apos;re offline. Please check your internet connection.</span>
        </div>
      )}
      
      {/* Ambient Decor */}
      <div className="absolute filter blur-[100px] -z-10 opacity-30 rounded-full w-[400px] h-[400px] bg-accent top-[-10%] right-[-5%]" />
      <div className="absolute filter blur-[100px] -z-10 opacity-20 rounded-full w-[300px] h-[300px] bg-soft-beige bottom-[-5%] left-[-5%]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-surface-container-lowest rounded-[2rem] sm:rounded-[3.5rem] shadow-luxury border border-outline-variant p-8 sm:p-10 md:p-14"
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-16 h-16 bg-espresso text-accent rounded-[1.25rem] flex items-center justify-center font-black text-2xl mx-auto mb-6 shadow-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso tracking-tight">
            Menux<span className="text-accent">SEC</span>
          </h1>
          <p className="text-on-surface-variant font-medium mt-2 text-sm">
            Administrative Access Portal
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-container border border-error text-on-error-container p-4 rounded-2xl mb-6 text-xs font-bold uppercase tracking-tight flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
            <Input
              type="email"
              placeholder="Email Address"
              className="h-14 bg-surface-container border-none rounded-2xl pl-12 pr-5 text-espresso placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-accent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || googleLoading}
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
            <Input
              type="password"
              placeholder="Password"
              className="h-14 bg-surface-container border-none rounded-2xl pl-12 pr-5 text-espresso placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || googleLoading}
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="h-14 bg-accent hover:bg-accent/90 text-on-primary rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-accent/20 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Google Login */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full h-14 bg-espresso hover:bg-primary text-on-primary rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-espresso/10 disabled:opacity-70 border-0 group"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </Button>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-outline-variant">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/50 text-center">
            Enhanced Security • Authorized Personnel Only
          </p>
        </div>
      </motion.div>
    </div>
  );
}
