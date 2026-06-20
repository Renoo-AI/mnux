'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', (await supabase.auth.getSession()).data.session?.user?.id || '')
      .maybeSingle();

    if (staff) {
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#2d2a26] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[#b48c68] font-bold text-xl">M</span>
          </div>
          <h1 className="text-xl font-bold text-[#2d2a26]">MenuxPro</h1>
          <p className="text-xs text-[#b48c68] font-bold uppercase tracking-widest mt-1">Connexion</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68] text-sm"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe" required
            className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68] text-sm"
          />
          <button type="submit" disabled={loading}
            className="w-full bg-[#2d2a26] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-[#71717a] mt-6">
          Pas de compte?{' '}
          <Link href="/signup" className="text-[#b48c68] font-bold hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
