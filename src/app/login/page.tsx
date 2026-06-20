'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, Eye, EyeOff, Coffee, UtensilsCrossed, Clock, Users,
  ArrowRight, Chrome, UserPlus, Building2, WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/browser';
import { useToast } from '@/hooks/use-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isSignup = searchParams.get('signup') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>(isSignup ? 'signup' : 'login');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGoogleAuth = async () => {
    if (!isOnline) { setError('You appear to be offline.'); return; }
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (googleError) throw googleError;
    } catch (err: unknown) {
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) { setError('You appear to be offline.'); return; }
    setError(null);
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      if (data.user) {
        const { data: existing } = await supabase.from('restaurants').select('id').eq('owner_id', data.user.id).maybeSingle();
        if (!existing) {
          const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          const slug = 'free-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

          const { data: restaurant } = await supabase.from('restaurants').insert({
            name: `${name || 'My Restaurant'} Menu`,
            slug,
            owner_id: data.user.id,
            plan: 'FREE',
            status: 'ACTIVE',
            currency: 'TND',
            watermark_enabled: true,
            max_menu_items: 8,
          }).select('id').single();

          if (restaurant) {
            await supabase.from('staff').insert({
              restaurant_id: restaurant.id,
              user_id: data.user.id,
              display_name: name || email,
              role: 'owner',
              is_active: true,
            });
          }
        }
      }

      toast({ title: 'Account created!', description: 'Your free restaurant menu is ready.' });
      router.push('/dashboard');
    } catch (err: unknown) {
      const supabaseError = err as { code?: string; message?: string };
      if (supabaseError.message?.includes('already registered')) setError('This email is already registered.');
      else if (supabaseError.message?.includes('password')) setError('Password should be at least 6 characters.');
      else setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) { setError('You appear to be offline.'); return; }
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push('/dashboard');
    } catch (err: unknown) {
      const supabaseError = err as { message?: string };
      if (supabaseError.message?.includes('Invalid login')) setError('Invalid email or password.');
      else if (supabaseError.message?.includes('too many')) setError('Too many attempts. Try again later.');
      else setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <Clock className="w-5 h-5" />, text: 'Real-time order updates' },
    { icon: <Users className="w-5 h-5" />, text: 'Staff coordination' },
    { icon: <UtensilsCrossed className="w-5 h-5" />, text: 'Table management' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>You&apos;re offline. Please check your internet connection.</span>
        </div>
      )}

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-espresso relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link href="/" className="font-display text-headline-md text-on-primary flex items-center gap-3 group">
              <div className="w-10 h-10 bg-secondary-fixed/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Coffee className="w-6 h-6 text-secondary-fixed" />
              </div>
              MenuxPro
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

            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-4 text-primary-fixed animate-slide-in-left" style={{ animationDelay: `${(i + 1) * 150}ms` }}>
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">{feature.icon}</div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-6 h-6 text-secondary-fixed" />
                <span className="font-semibold text-white">Start Free</span>
              </div>
              <p className="text-sm text-white/80">
                Create your digital menu for free. QR codes, table ordering, and real-time dashboard included.
                Upgrade to Pro for custom branding and unlimited items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-primary-fixed text-sm">
            <span>&copy; 2026 MenuxPro</span>
            <span>&bull;</span>
            <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
            <Link href="https://wa.me/21656110674" target="_blank" className="hover:text-secondary transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-surface">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-12 text-center">
            <Link href="/" className="font-display text-3xl text-primary inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center">
                <Coffee className="w-7 h-7 text-on-secondary-container" />
              </div>
              MenuxPro
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl text-primary mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-on-surface-variant">
              {mode === 'login' ? 'Sign in to access your dashboard' : 'Start your free digital menu today'}
            </p>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleAuth} disabled={loading || googleLoading}
            className="w-full py-4 rounded-xl font-semibold border-2 border-outline-variant hover:border-secondary hover:bg-secondary-fixed/10 transition-all duration-300 mb-6">
            {googleLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Chrome className="w-5 h-5 mr-2" />}
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-surface text-on-surface-variant">or</span></div>
          </div>

          <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp} className="space-y-6">
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm flex items-center gap-3 animate-slide-in-up">
                <div className="w-8 h-8 bg-error/20 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-error">!</span></div>
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="font-label-caps text-xs text-on-surface-variant tracking-wider">RESTAURANT NAME</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Café Bella Vista" required
                  className="w-full p-4 border border-outline-variant rounded-xl font-body bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-caps text-xs text-on-surface-variant tracking-wider">EMAIL ADDRESS</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.com" required
                className="w-full p-4 border border-outline-variant rounded-xl font-body bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="font-label-caps text-xs text-on-surface-variant tracking-wider">PASSWORD</Label>
                {mode === 'login' && <Link href="#" className="text-xs text-secondary hover:underline">Forgot password?</Link>}
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'} required
                  className="w-full p-4 border border-outline-variant rounded-xl font-body bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading || googleLoading}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold text-base hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 group">
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                <>{mode === 'login' ? (<><>Sign In<ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></></>)
                  : (<><UserPlus className="w-5 h-5 mr-2" />Create Free Account</>)}</>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-on-surface-variant">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}<button onClick={() => setMode('signup')} className="text-secondary hover:underline font-medium">Start free</button></>
            ) : (
              <>Already have an account?{' '}<button onClick={() => setMode('login')} className="text-secondary hover:underline font-medium">Sign in</button></>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-outline-variant text-center">
            <a href="https://wa.me/21656110674" target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-secondary transition-colors">
              Need help? Contact us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
