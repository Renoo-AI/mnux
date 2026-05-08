'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coffee, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3A322D]" />
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

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await loginStaff('zcoffee', '1234');
      
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
    setError('');
    setIsLoading(true);

    try {
      const result = await loginStaff('zcoffee', '5678');
      
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
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9] p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#EFE4D8] rounded-full opacity-50 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#C9A07E]/20 rounded-full opacity-50 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-xl bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-[#3A322D] to-[#5A4A3D] flex items-center justify-center">
            <Coffee className="h-8 w-8 text-[#C9A07E]" />
          </div>
          <CardTitle className="text-2xl font-serif text-[#3A322D]">MenuxPro</CardTitle>
          <CardDescription className="text-[#5A4A3D]">
            Sign in to access your restaurant dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#EFE4D8]/50">
              <TabsTrigger value="staff" className="data-[state=active]:bg-white">
                Staff Login
              </TabsTrigger>
              <TabsTrigger value="superadmin" className="data-[state=active]:bg-white">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="staff" className="space-y-4 mt-4">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant" className="text-[#3A322D] font-medium">
                    Restaurant Code
                  </Label>
                  <Input
                    id="restaurant"
                    type="text"
                    placeholder="e.g., zcoffee"
                    value={restaurantSlug}
                    onChange={(e) => setRestaurantSlug(e.target.value.toLowerCase())}
                    className="h-12 border-[#EFE4D8] focus:border-[#C9A07E] focus:ring-[#C9A07E]"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-[#3A322D] font-medium">
                    Staff PIN
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? 'text' : 'password'}
                      placeholder="Enter your PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 pr-12 border-[#EFE4D8] focus:border-[#C9A07E] focus:ring-[#C9A07E]"
                      disabled={isLoading}
                      required
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4A3D] hover:text-[#3A322D]"
                    >
                      {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#3A322D] hover:bg-[#5A4A3D] text-white font-medium"
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

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#EFE4D8]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-[#5A4A3D]">Demo Access</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-[#C9A07E] text-[#C9A07E] hover:bg-[#C9A07E]/10"
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
                  className="h-12 border-[#3A322D] text-[#3A322D] hover:bg-[#3A322D]/10"
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
            </TabsContent>

            <TabsContent value="superadmin" className="space-y-4 mt-4">
              <form onSubmit={handleSuperadminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#3A322D] font-medium">
                    Admin Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@menuxpro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-[#EFE4D8] focus:border-[#C9A07E] focus:ring-[#C9A07E]"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#3A322D] font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12 border-[#EFE4D8] focus:border-[#C9A07E] focus:ring-[#C9A07E]"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A4A3D] hover:text-[#3A322D]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#3A322D] to-[#5A4A3D] hover:from-[#5A4A3D] hover:to-[#3A322D] text-white font-medium"
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

              <div className="p-4 rounded-lg bg-[#3A322D]/5 border border-[#EFE4D8]">
                <p className="text-xs text-[#5A4A3D] text-center">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Superadmin access is restricted to authorized personnel only.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-[#5A4A3D] mt-4">
            Contact your manager if you need access credentials
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
