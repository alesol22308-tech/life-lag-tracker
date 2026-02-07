'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if user is authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }
        setCheckingAuth(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    }
    checkAuth();
  }, [supabase, router]);

  const handleSetPassword = async (e: React.FormEvent) => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Mark that user has password in our database
      const { error: dbError } = await supabase
        .from('users')
        .update({ has_password: true })
        .eq('id', user.id);

      // Ignore error if column doesn't exist (migration not run)
      if (dbError && !dbError.message?.includes('column')) {
        console.error('Error updating has_password:', dbError);
      }

      setMessage('Password set successfully!');
      setMessageType('success');
      
      // Redirect to home after a brief delay
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    } catch (error: any) {
      setMessage(error.message || 'Failed to set password');
      setMessageType('error');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // User chooses to use magic links only, redirect to home
    router.push('/home');
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
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-4xl font-semibold text-text0">Welcome to Life-Lag!</h1>
          <p className="text-text1">
            Set up a password for faster sign-ins, or skip to continue with magic links.
          </p>
        </div>

        <GlassCard padding="lg">
          <form onSubmit={handleSetPassword} className="space-y-6">
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
                  className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent text-lg placeholder:text-text2"
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
                className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent text-lg placeholder:text-text2"
                placeholder="Confirm your password"
              />
            </div>

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full text-lg py-4"
            >
              {loading ? 'Setting up...' : 'Set Password'}
            </PrimaryButton>

            {message && (
              <p className={`text-sm ${messageType === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {message}
              </p>
            )}

            <div className="text-center pt-2">
              <GhostButton
                type="button"
                onClick={handleSkip}
                className="w-full"
              >
                Skip for now (use magic links)
              </GhostButton>
            </div>

            <p className="text-xs text-text2 text-center">
              You can always set up or change your password later in Settings.
            </p>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
