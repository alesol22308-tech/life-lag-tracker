'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid') || error.message.includes('credentials')) {
          setMessage(t('invalidEmailPassword'));
        } else if (error.message.includes('Email not confirmed')) {
          setMessage(t('confirmEmailFirst'));
        } else {
          setMessage(error.message);
        }
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Successfully signed in with password, redirect to home
      router.push('/home');
    } catch (error: any) {
      setMessage(error.message || tCommon('error'));
      setMessageType('error');
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signin`,
        },
      });

      if (error) throw error;

      setMessage(t('checkEmail'));
      setMessageType('success');
    } catch (error: any) {
      setMessage(error.message || tCommon('error'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (useMagicLink) {
      handleMagicLinkLogin(e);
    } else {
      handlePasswordLogin(e);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-text1">{tCommon('loading')}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-semibold text-text0">{t('signIn')}</h1>
          <p className="text-text1">
            {useMagicLink ? t('checkEmail') : t('email') + ' / ' + t('password')}
          </p>
        </div>

        <GlassCard padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text1 mb-2">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent text-lg placeholder:text-text2"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            {!useMagicLink && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text1 mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent text-lg placeholder:text-text2"
                    placeholder={t('passwordPlaceholder')}
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
            )}

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full text-lg py-4"
            >
              {loading ? (useMagicLink ? t('sending') : t('signingIn')) : (useMagicLink ? t('sendMagicLink') : t('signIn'))}
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
                }}
                className="text-sm text-text2 hover:text-text1 transition-colors underline"
              >
                {useMagicLink ? t('usePasswordInstead') : t('forgotPassword') + ' ' + t('sendMagicLink')}
              </button>
            </div>
          </form>
        </GlassCard>

        <div className="text-center space-y-4">
          <p className="text-sm text-text1">
            {t('noAccount')}{' '}
            <Link href="/signup" className="text-text0 hover:underline font-medium">
              {t('signUp')}
            </Link>
          </p>
          <Link href="/" className="text-sm text-text2 hover:text-text1 transition-colors block">
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
