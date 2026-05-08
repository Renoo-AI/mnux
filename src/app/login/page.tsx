'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { setUser, isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authService.signIn(email, password);
      
      if (user) {
        setUser(user);
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div>
          <Link href="/" className="font-display text-headline-md text-on-primary">
            Menux
          </Link>
        </div>
        
        <div>
          <h1 className="font-display text-display-lg text-on-primary leading-tight mb-6">
            Manage your restaurant with elegance.
          </h1>
          <p className="text-primary-fixed text-body-lg max-w-md">
            Real-time table management, order tracking, and staff coordination — 
            all in one beautiful dashboard.
          </p>
        </div>
        
        <div className="text-primary-fixed text-sm">
          © 2024 Menux. Premium restaurant management.
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-display text-headline-md text-primary">
              Menux
            </Link>
          </div>
          
          <div className="mb-8">
            <h2 className="font-display text-headline-md text-primary mb-2">
              Welcome back
            </h2>
            <p className="text-on-surface-variant">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant">
                EMAIL ADDRESS
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@restaurant.com"
                required
                className="w-full p-4 border border-outline-variant rounded-xl font-body bg-surface-container-low focus:border-secondary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="font-label-caps text-label-caps text-on-surface-variant">
                PASSWORD
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full p-4 border border-outline-variant rounded-xl font-body bg-surface-container-low focus:border-secondary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                <input type="checkbox" className="rounded border-outline" />
                Remember me
              </label>
              <Link href="#" className="text-sm text-secondary hover:underline">
                Forgot password?
              </Link>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link href="#" className="text-secondary hover:underline">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
