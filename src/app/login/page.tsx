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
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      setError('Check your email for confirmation.');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/dashboard'); return; }

    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    router.push(staff ? '/dashboard' : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-sm shadow-[0_20px_60px_rgba(180,140,104,0.15)] border border-black/[0.04]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#2d2a26] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="24" height="24" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
              <path fill="#b48c68" d="M2 2h6v1H4v1h4v1H2v1h6v1H2V2z" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tight text-[#2d2a26]" style={{ fontFamily: 'var(--font-display), Georgia, serif' }}>
            {isSignup ? 'Créer un compte' : 'MenuxPro'}
          </h1>
          <p className="text-[10px] text-[#b48c68] font-bold uppercase tracking-[0.3em] mt-1">
            {isSignup ? 'Démarrer gratuitement' : 'Administration'}
          </p>
        </div>

        {error && (
          <div className={`text-xs font-bold p-3 rounded-xl mb-4 ${error.includes('Check your email') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717a] mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="vous@cafe.tn" required
              className="w-full bg-[#faf9f6] border border-black/[0.05] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#b48c68] focus:ring-1 focus:ring-[#b48c68]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717a] mb-1.5">Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full bg-[#faf9f6] border border-black/[0.05] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#b48c68] focus:ring-1 focus:ring-[#b48c68]/20 transition-all"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#2d2a26] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#b48c68] transition-all shadow-lg shadow-black/10 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Connexion...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsSignup(!isSignup); setError(''); }}
            className="text-xs text-[#b48c68] font-bold hover:underline">
            {isSignup ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-black/[0.04] flex justify-center gap-4">
          <Link href="/r/zcoffee" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717a] hover:text-[#b48c68] transition-colors">Démo</Link>
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717a] hover:text-[#b48c68] transition-colors">Accueil</Link>
        </div>
      </div>
    </div>
  );
}
