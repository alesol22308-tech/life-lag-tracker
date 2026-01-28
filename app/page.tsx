'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WalkthroughCarousel from '@/components/WalkthroughCarousel';
import TestimonialsSection from '@/components/TestimonialsSection';

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
          <h1 className="text-5xl sm:text-6xl font-semibold text-text0 tracking-tight">
            Life-Lag
          </h1>
          <p className="text-xl sm:text-2xl text-text1 font-light leading-relaxed">
            Detect early life drift before patterns shift
          </p>
        </div>

        <div className="space-y-8 pt-8">
          <div className="space-y-4 text-lg text-text1 leading-relaxed max-w-xl mx-auto">
            <p>
              A 3-minute weekly check-in that calculates your Lag Score and delivers one personalized, actionable tip.
            </p>
            <p className="text-base text-text1">
              This is maintenance, not measurement. Tune your baseline, not your performance.
            </p>
            <p className="text-sm text-text2 pt-2">
              <Link
                href="/science"
                className="text-text2 hover:text-text1 underline underline-offset-4 transition-colors duration-200"
              >
                Learn about the science behind Life-Lag
              </Link>
            </p>
          </div>

          {/* Walkthrough Carousel */}
          <div className="pt-8 max-w-2xl mx-auto">
            <WalkthroughCarousel />
          </div>

          <div className="pt-8 space-y-4">
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-transparent border border-cardBorder text-text0 text-lg font-medium rounded-lg hover:border-white/30 transition-all duration-200"
              style={{
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.05)',
              }}
            >
              Get Started
            </Link>
            <p className="text-sm text-text2">
              Already have an account?{' '}
              <Link href="/login" className="text-text1 hover:text-text0 underline underline-offset-4 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>

          {/* Testimonials Section */}
          <div className="pt-12 max-w-5xl mx-auto">
            <TestimonialsSection />
          </div>
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
