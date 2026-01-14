import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import WalkthroughCarousel from '@/components/WalkthroughCarousel';
import TestimonialsSection from '@/components/TestimonialsSection';

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If authenticated, redirect to home
  if (user) {
    redirect('/home');
  }

  // Show landing page for unauthenticated users
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <div className="space-y-6">
          <h1 className="text-5xl sm:text-6xl font-light text-gray-900 tracking-tight">
            Life-Lag
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 font-light leading-relaxed">
            Detect early life drift before patterns shift
          </p>
        </div>

        <div className="space-y-8 pt-8">
          <div className="space-y-4 text-lg text-gray-700 leading-relaxed max-w-xl mx-auto">
            <p>
              A 3-minute weekly check-in that calculates your Lag Score and delivers one personalized, actionable tip.
            </p>
            <p className="text-base text-gray-600">
              This is maintenance, not measurement. Tune your baseline, not your performance.
            </p>
          </div>

          {/* Walkthrough Carousel */}
          <div className="pt-8 max-w-2xl mx-auto">
            <WalkthroughCarousel />
          </div>

          <div className="pt-8">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-slate-700 text-white text-lg font-medium rounded-lg hover:bg-slate-800 transition-colors duration-200 shadow-soft-md"
            >
              Get Started
            </Link>
          </div>

          {/* Testimonials Section */}
          <div className="pt-12 max-w-5xl mx-auto">
            <TestimonialsSection />
          </div>
        </div>

        <div className="pt-16 space-y-4 text-sm text-gray-500">
          <p>Privacy-first. No tracking.</p>
          <p>Just you and your weekly tune-up.</p>
        </div>
      </div>
    </main>
  );
}
