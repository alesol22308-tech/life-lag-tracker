'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate password
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setMessage('This email is already registered. Please sign in instead.');
        } else {
          setMessage(error.message);
        }
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setMessage('Check your email to confirm your account!');
        setMessageType('success');
      } else if (data.session) {
        // User was created and logged in (email confirmation disabled)
        // Update has_password flag
        await supabase
          .from('users')
          .upsert({ 
            id: data.user!.id, 
            email: data.user!.email,
            has_password: true 
          });
        
        router.push('/home');
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup&setup=true`,
        },
      });

      if (error) throw error;

      setMessage('Check your email for the magic link!');
      setMessageType('success');
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (useMagicLink) {
      handleMagicLinkSignUp(e);
    } else {
      handlePasswordSignUp(e);
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
          <h1 className="text-4xl font-semibold text-text0">Create Account</h1>
          <p className="text-text1">
            {useMagicLink 
              ? "We'll email you a magic link to get started" 
              : 'Sign up with your email and password'}
          </p>
        </div>

        <GlassCard padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {!useMagicLink && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text1 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent text-lg placeholder:text-text2"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text2 hover:text-text1 transition-colors text-sm"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text1 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent text-lg placeholder:text-text2"
                    placeholder="Confirm your password"
                  />
                </div>
              </>
            )}

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full text-lg py-4"
            >
              {loading 
                ? (useMagicLink ? 'Sending...' : 'Creating account...') 
                : (useMagicLink ? 'Send Magic Link' : 'Create Account')}
            </PrimaryButton>

            {message && (
              <p className={`text-sm ${messageType === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {message}
              </p>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setUseMagicLink(!useMagicLink);
                  setMessage('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-text2 hover:text-text1 transition-colors underline"
              >
                {useMagicLink ? 'Sign up with password instead' : 'Sign up with magic link instead'}
              </button>
            </div>
          </form>
        </GlassCard>

        <div className="text-center space-y-4">
          <p className="text-sm text-text1">
            Already have an account?{' '}
            <Link href="/login" className="text-text0 hover:underline font-medium">
              Sign in
            </Link>
          </p>
          <Link href="/" className="text-sm text-text2 hover:text-text1 transition-colors block">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
