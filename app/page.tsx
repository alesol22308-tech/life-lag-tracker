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
    <main id="main-content" className="min-h-screen flex flex-col relative z-10">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg1 pointer-events-none" aria-hidden />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-text0/5 dark:bg-white/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-text0/5 dark:bg-white/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="relative max-w-2xl mx-auto text-center space-y-8">
          <div className="flex justify-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-1 ring-cardBorder/50 shadow-glowSm">
              <Image
                src="/lifelagicon.png"
                alt=""
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-text0 tracking-tight">
              Life-Lag
            </h1>
            <p className="text-xl sm:text-2xl text-text1 font-light leading-relaxed max-w-lg mx-auto">
              Catch life drift early—before it becomes burnout
            </p>
            <p className="text-base sm:text-lg text-text2 max-w-md mx-auto">
              Small shifts show up before they feel obvious. Life-Lag helps you notice them.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20 sm:pb-24 space-y-10">
        {/* Problem */}
        <section className="rounded-2xl border border-cardBorder bg-card dark:bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-soft">
          <h2 className="text-lg font-semibold text-text0 mb-3">
            The problem: we notice too late
          </h2>
          <p className="text-text1 leading-relaxed">
            You can stay functional under load for a while—then suddenly feel depleted or brittle. By the time it&apos;s obvious, recovery takes longer.
          </p>
        </section>

        {/* Solution */}
        <section className="rounded-2xl border border-cardBorder bg-card dark:bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-soft">
          <h2 className="text-lg font-semibold text-text0 mb-3">
            The solution: weekly tune-up
          </h2>
          <p className="text-text1 leading-relaxed mb-4">
            A 3-minute weekly check-in that captures early signals, compares to your baseline, and delivers one small adjustment—so course correction stays gentle and doable.
          </p>
          <p className="text-sm text-text2 italic border-l-2 border-cardBorder pl-4">
            This is maintenance, not measurement. Tune your baseline, not your performance.
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-text1">
              Your Lag Score shows how far you&apos;ve drifted from your baseline—so you can adjust before it gets hard.
            </p>
            <h2 className="text-lg font-semibold text-text0">
              How it works
            </h2>
          </div>
          <div className="rounded-2xl border border-cardBorder bg-card/50 dark:bg-card/40 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
            <WalkthroughCarousel />
          </div>
        </section>

        {/* Benefits */}
        <section className="rounded-2xl border border-cardBorder bg-card dark:bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-soft">
          <h2 className="text-lg font-semibold text-text0 mb-4 text-center">
            What you get
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-text1 text-sm sm:text-base">
            <li className="flex items-start gap-2">
              <span className="text-text2 mt-0.5">·</span>
              <span>~3 minutes per week—low friction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-text2 mt-0.5">·</span>
              <span>Early drift detection before it compounds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-text2 mt-0.5">·</span>
              <span>One personalized, actionable tip each week</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-text2 mt-0.5">·</span>
              <span>Trend visibility over time</span>
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <span className="text-text2 mt-0.5">·</span>
              <span>Privacy-first. No tracking.</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <div className="text-center pt-4 space-y-6">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg0 focus:ring-text0/30 bg-text0 text-bg0 hover:opacity-90 shadow-soft-md dark:shadow-glowMd"
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

        {/* Footer */}
        <footer className="pt-12 text-center space-y-3 text-sm text-text2 border-t border-cardBorder/50">
          <p>Privacy-first. No tracking.</p>
          <p>Just you and your weekly tune-up.</p>
          <p>
            <Link
              href="/science"
              className="hover:text-text1 underline underline-offset-4 transition-colors duration-200"
            >
              The science behind Life-Lag
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
