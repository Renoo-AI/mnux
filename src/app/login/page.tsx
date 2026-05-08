'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Coffee, UtensilsCrossed, Clock, Users, ArrowRight, Check } from 'lucide-react';
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

  const handleDemoLogin = () => {
    setLoading(true);
    // Simulate demo login
    setTimeout(() => {
      setUser({
        uid: 'demo-user',
        email: 'demo@menux.app',
        role: 'manager',
        staffProfile: {
          name: 'Demo Manager',
          role: 'manager',
        },
      });
      router.push('/dashboard');
    }, 800);
  };

  const features = [
    { icon: <Clock className="w-5 h-5" />, text: 'Real-time order updates' },
    { icon: <Users className="w-5 h-5" />, text: 'Staff coordination' },
    { icon: <UtensilsCrossed className="w-5 h-5" />, text: 'Table management' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-espresso relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link href="/" className="font-display text-headline-md text-on-primary flex items-center gap-3 group">
              <div className="w-10 h-10 bg-secondary-fixed/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Coffee className="w-6 h-6 text-secondary-fixed" />
              </div>
              Menux
            </Link>
          </div>
          
          <div className="space-y-8">
            <div className="animate-fade-in">
              <h1 className="font-display text-5xl xl:text-6xl text-on-primary leading-tight mb-6">
                Manage your restaurant <span className="italic text-secondary-fixed">with elegance.</span>
              </h1>
              <p className="text-primary-fixed text-lg max-w-md leading-relaxed">
                Real-time table management, order tracking, and staff coordination — 
                all in one beautiful dashboard designed for modern hospitality.
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 text-primary-fixed animate-slide-in-left"
                  style={{ animationDelay: `${(i + 1) * 150}ms` }}
                >
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-primary-fixed text-sm">
            <span>© 2024 Menux</span>
            <span>•</span>
            <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
            <Link href="/r/demo" className="hover:text-secondary transition-colors">Demo Menu</Link>
          </div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-surface">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 text-center">
            <Link href="/" className="font-display text-3xl text-primary inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center">
                <Coffee className="w-7 h-7 text-on-secondary-container" />
              </div>
              Menux
            </Link>
          </div>
          
          <div className="mb-8">
            <h2 className="font-display text-3xl text-primary mb-2">
              Welcome back
            </h2>
            <p className="text-on-surface-variant">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm flex items-center gap-3 animate-slide-in-up">
                <div className="w-8 h-8 bg-error/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-error">!</span>
                </div>
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-caps text-xs text-on-surface-variant tracking-wider">
                EMAIL ADDRESS
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@restaurant.com"
                required
                className="w-full p-4 border border-outline-variant rounded-xl font-body bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="font-label-caps text-xs text-on-surface-variant tracking-wider">
                  PASSWORD
                </Label>
                <Link href="#" className="text-xs text-secondary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full p-4 border border-outline-variant rounded-xl font-body bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="remember"
                className="w-4 h-4 rounded border-outline text-secondary focus:ring-secondary/50 cursor-pointer" 
              />
              <label htmlFor="remember" className="text-sm text-on-surface-variant cursor-pointer">
                Remember me for 30 days
              </label>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold text-base hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          
          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-on-surface-variant">or</span>
            </div>
          </div>
          
          {/* Demo Login */}
          <Button
            type="button"
            variant="outline"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold border-2 border-outline-variant hover:border-secondary hover:bg-secondary-fixed/10 transition-all duration-300"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2 text-secondary" />
                Try Demo Dashboard
              </>
            )}
          </Button>
          
          <div className="mt-8 text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link href="#" className="text-secondary hover:underline font-medium">
              Contact sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
