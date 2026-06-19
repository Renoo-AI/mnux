'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coffee, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

// Honeypot field names (should match server-side)
const HONEYPOT_FIELDS = ['website', 'fax', 'company_name'];

export default function StaffLoginPage() {
  const router = useRouter();
  const { loginStaff, loginSuperadmin, isStaffAuthenticated, isLoading: sessionLoading } = useStaffSession();
  
  // Staff login state
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  // Superadmin login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Honeypot fields (should remain empty)
  const [honeypotWebsite, setHoneypotWebsite] = useState('');
  const [honeypotFax, setHoneypotFax] = useState('');
  
  // Form timing
  const [formLoadTime, setFormLoadTime] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Record form load time for timing validation
  useEffect(() => {
    setFormLoadTime(Date.now());
  }, []);

  // Redirect if already authenticated
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-espresso" />
      </div>
    );
  }

  if (isStaffAuthenticated) {
    router.push('/staff/dashboard');
    return null;
  }

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Honeypot check - if filled, silently fail (bot detection)
    if (honeypotWebsite || honeypotFax) {
      // Log the honeypot trigger silently
      console.warn('Honeypot triggered - possible bot detected');
      // Fake success to confuse bots
      setTimeout(() => {
        setError('Invalid credentials');
        setIsLoading(false);
      }, 1500);
      setIsLoading(true);
      return;
    }
    
    // Timing check - too fast = bot
    const elapsed = Date.now() - formLoadTime;
    if (elapsed < 1500) {
      // Too fast, likely a bot
      setError('Please try again');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await loginStaff(restaurantSlug, pin);
      
      if (result.success) {
        router.push('/staff/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperadminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Honeypot check
    if (honeypotWebsite || honeypotFax) {
      console.warn('Honeypot triggered - possible bot detected');
      setTimeout(() => {
        setError('Invalid credentials');
        setIsLoading(false);
      }, 2000);
      setIsLoading(true);
      return;
    }
    
    // Timing check
    const elapsed = Date.now() - formLoadTime;
    if (elapsed < 2000) {
      setError('Please try again');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await loginSuperadmin(email, password);
      
      if (result.success) {
        router.push('/staff/dashboard');
      } else {
        setError(result.error || 'Superadmin login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo mode is only available in development with explicit enable flag
  const isDemoModeEnabled = process.env.NODE_ENV !== 'production' && 
                            process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';

  const handleDemoLogin = async () => {
    if (!isDemoModeEnabled) return;
    
    const demoSlug = process.env.NEXT_PUBLIC_DEMO_RESTAURANT_SLUG || 'demo';
    const demoPin = process.env.NEXT_PUBLIC_DEMO_CASHIER_PIN || '0000';
    
    setError('');
    setIsLoading(true);

    try {
      const result = await loginStaff(demoSlug, demoPin);
      
      if (result.success) {
        router.push('/staff/dashboard');
      } else {
        setError(result.error || 'Demo login failed');
      }
    } catch {
      setError('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerDemoLogin = async () => {
    if (!isDemoModeEnabled) return;
    
    const demoSlug = process.env.NEXT_PUBLIC_DEMO_RESTAURANT_SLUG || 'demo';
    const demoPin = process.env.NEXT_PUBLIC_DEMO_OWNER_PIN || '0000';
    
    setError('');
    setIsLoading(true);

    try {
      const result = await loginStaff(demoSlug, demoPin);
      
      if (result.success) {
        router.push('/staff/dashboard');
      } else {
        setError(result.error || 'Demo login failed');
      }
    } catch {
      setError('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-soft-beige rounded-full opacity-50 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/20 rounded-full opacity-50 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-luxury bg-surface-container-lowest/90 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-espresso to-primary flex items-center justify-center">
            <Coffee className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-serif text-espresso">MenuxPro</CardTitle>
          <CardDescription className="text-on-surface-variant">
            Sign in to access your restaurant dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-soft-beige/50">
              <TabsTrigger value="staff" className="data-[state=active]:bg-surface-container-lowest">
                Staff Login
              </TabsTrigger>
              <TabsTrigger value="superadmin" className="data-[state=active]:bg-surface-container-lowest">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="staff" className="space-y-4 mt-4">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                {/* Honeypot fields - hidden from real users */}
                <div className="hidden" aria-hidden="true">
                  <Input
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotWebsite}
                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                    className="absolute -left-[9999px]"
                  />
                  <Input
                    name="fax"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotFax}
                    onChange={(e) => setHoneypotFax(e.target.value)}
                    className="absolute -left-[9999px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant" className="text-espresso font-medium">
                    Restaurant Code
                  </Label>
                  <Input
                    id="restaurant"
                    type="text"
                    placeholder="e.g., zcoffee"
                    value={restaurantSlug}
                    onChange={(e) => setRestaurantSlug(e.target.value.toLowerCase())}
                    className="h-12 border-outline-variant focus:border-accent focus:ring-accent"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-espresso font-medium">
                    Staff PIN
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? 'text' : 'password'}
                      placeholder="Enter your PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 pr-12 border-outline-variant focus:border-accent focus:ring-accent"
                      disabled={isLoading}
                      required
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-espresso"
                    >
                      {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-error-container border border-error text-on-error-container text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-espresso hover:bg-primary text-on-primary font-medium"
                  disabled={isLoading || !restaurantSlug || !pin}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Demo buttons only shown in development with NEXT_PUBLIC_ENABLE_DEMO_MODE=true */}
              {isDemoModeEnabled && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-outline-variant" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-surface-container-lowest px-2 text-on-surface-variant">Demo Access (Dev Only)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-accent text-accent hover:bg-accent/10"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Coffee className="mr-2 h-4 w-4" />
                          Cashier
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-espresso text-espresso hover:bg-espresso/10"
                      onClick={handleOwnerDemoLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Owner
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="superadmin" className="space-y-4 mt-4">
              <form onSubmit={handleSuperadminLogin} className="space-y-4">
                {/* Honeypot fields - hidden from real users */}
                <div className="hidden" aria-hidden="true">
                  <Input
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotWebsite}
                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                    className="absolute -left-[9999px]"
                  />
                  <Input
                    name="fax"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotFax}
                    onChange={(e) => setHoneypotFax(e.target.value)}
                    className="absolute -left-[9999px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-espresso font-medium">
                    Admin Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@menuxpro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-outline-variant focus:border-accent focus:ring-accent"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-espresso font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12 border-outline-variant focus:border-accent focus:ring-accent"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-espresso"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-error-container border border-error text-on-error-container text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-espresso to-primary hover:from-primary hover:to-espresso text-on-primary font-medium"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="p-4 rounded-lg bg-espresso/5 border border-outline-variant">
                <p className="text-xs text-on-surface-variant text-center">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Superadmin access is restricted to authorized personnel only.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-on-surface-variant mt-4">
            Contact your manager if you need access credentials
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
