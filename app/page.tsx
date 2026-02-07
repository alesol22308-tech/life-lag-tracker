'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import WalkthroughCarousel from '@/components/WalkthroughCarousel';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push('/home');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
      setLoading(false);
    }
    checkAuth();
  }, [supabase, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text1">Loading...</div>
      </main>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-24 relative z-10">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32">
              <Image
                src="/lifelagicon.png"
                alt="Life-Lag Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold text-text0 tracking-tight">
            Life-Lag
          </h1>
          <p className="text-xl sm:text-2xl text-text1 font-light leading-relaxed">
            Catch life drift early—before it becomes burnout
          </p>
          <p className="text-lg text-text1 max-w-xl mx-auto">
            Small shifts show up before they feel obvious. Life-Lag helps you notice them.
          </p>
        </div>

        {/* Problem Section */}
        <section className="space-y-3 max-w-xl mx-auto text-center pt-4">
          <h2 className="text-lg font-semibold text-text0">
            The problem: we notice too late
          </h2>
          <p className="text-text1 leading-relaxed">
            You can stay functional under load for a while—then suddenly feel depleted or brittle. By the time it&apos;s obvious, recovery takes longer.
          </p>
        </section>

        {/* Solution Section */}
        <section className="space-y-3 max-w-xl mx-auto text-center pt-4">
          <h2 className="text-lg font-semibold text-text0">
            The solution: weekly tune-up
          </h2>
          <p className="text-text1 leading-relaxed">
            A 3-minute weekly check-in that captures early signals, compares to your baseline, and delivers one small adjustment—so course correction stays gentle and doable.
          </p>
          <p className="text-base text-text1 italic">
            This is maintenance, not measurement. Tune your baseline, not your performance.
          </p>
        </section>

        {/* Lag Score + How It Works */}
        <section className="space-y-4 max-w-2xl mx-auto pt-8">
          <p className="text-text1 text-center">
            Your Lag Score shows how far you&apos;ve drifted from your baseline—so you can adjust before it gets hard.
          </p>
          <h2 className="text-lg font-semibold text-text0 text-center">
            How it works
          </h2>
          <WalkthroughCarousel />
        </section>

        {/* Benefits List */}
        <section className="space-y-3 max-w-xl mx-auto text-center pt-8">
          <ul className="text-text1 text-left inline-block space-y-2 list-disc list-inside">
            <li>~3 minutes per week—low friction</li>
            <li>Early drift detection before it compounds</li>
            <li>One personalized, actionable tip each week</li>
            <li>Trend visibility so you see direction over time</li>
            <li>Privacy-first. No tracking.</li>
          </ul>
        </section>

        {/* CTA */}
        <div className="pt-8 space-y-4">
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-transparent border border-cardBorder text-text0 text-lg font-medium rounded-lg hover:border-white/30 transition-all duration-200"
            style={{
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.05)',
            }}
          >
            Take your first 3-minute check-in
          </Link>
          <p className="text-sm text-text2">
            Already have an account?{' '}
            <Link href="/login" className="text-text1 hover:text-text0 underline underline-offset-4 transition-colors duration-200">
              Sign in
            </Link>
          </p>
        </div>

        <div className="pt-16 space-y-4 text-sm text-text2">
          <p>Privacy-first. No tracking.</p>
          <p>Just you and your weekly tune-up.</p>
          <p className="pt-2">
            <Link
              href="/science"
              className="text-text2 hover:text-text1 underline underline-offset-4 transition-colors duration-200"
            >
              The science behind Life-Lag
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
