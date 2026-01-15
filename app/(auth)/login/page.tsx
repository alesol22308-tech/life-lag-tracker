'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check error:', error);
          setCheckingAuth(false);
          return;
        }
        if (user) {
          router.push('/home');
          return;
        }
        setCheckingAuth(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMessage('Check your email for the magic link!');
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-text1">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-semibold text-text0">Continue</h1>
          <p className="text-text1">
            No password. We&apos;ll email you a link.
          </p>
        </div>

        <GlassCard padding="lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text1 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent text-lg placeholder:text-text2"
                placeholder="you@example.com"
              />
            </div>

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full text-lg py-4"
            >
              {loading ? 'Sending...' : 'Continue'}
            </PrimaryButton>

            {message && (
              <p className={`text-sm ${message.includes('error') || message.includes('Error') ? 'text-red-400' : 'text-text1'}`}>
                {message}
              </p>
            )}
          </form>
        </GlassCard>

        <div className="text-center">
          <Link href="/" className="text-sm text-text2 hover:text-text1 transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
