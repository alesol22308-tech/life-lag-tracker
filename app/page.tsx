import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto text-center space-y-12">
        <div className="space-y-6">
          <h1 className="text-5xl sm:text-6xl font-light text-gray-900 tracking-tight">
            Life Lag
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 font-light leading-relaxed">
            Detect early life drift before burnout or collapse occurs
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

          <div className="pt-8">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gray-900 text-white text-lg font-medium rounded-sm hover:bg-gray-800 transition-colors duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="pt-16 space-y-4 text-sm text-gray-500">
          <p>Privacy-first. No tracking. No dashboards.</p>
          <p>Just you and your weekly tune-up.</p>
        </div>
      </div>
    </main>
  );
}
