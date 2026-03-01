import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Life-Lag privacy policy: how we handle your data, third-party services, and your rights.',
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg0 text-text0 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-invert prose-headings:text-text0 prose-p:text-text1 prose-a:text-primary break-words">
        <h1 className="text-3xl sm:text-4xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-text2 mb-8">Last updated: February 2025</p>

        <p>
          Life-Lag (&quot;we&quot;, &quot;our&quot;) is a weekly drift detection tool. This policy describes how we collect, use, and protect your information.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Data we collect</h2>
        <p>
          We store only what you provide: account details (email, optional password), weekly check-in answers (six dimension scores and an optional reflection note), micro-goal text and status, and preferences (e.g. reminder day/time, theme). We use this to compute your Lag Score, show trends, and deliver tips.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">No tracking</h2>
        <p>
          We do not use cross-site tracking, advertising networks, or third-party cookies for tracking. We do not sell your data. If we use minimal analytics (e.g. aggregated page views to improve the product), we do not track individuals or link activity to your identity beyond what is needed to run the app.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Third-party services</h2>
        <p>
          We use the following services to run the app:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-text1">
          <li><strong>Supabase</strong> – Authentication and database. Your account and check-in data are stored in Supabase. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Supabase Privacy</a>.</li>
          <li><strong>Vercel</strong> – Hosting and, if enabled, minimal analytics (e.g. page views). See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">Vercel Privacy</a>.</li>
        </ul>
        <p className="mt-2">
          Push notifications (when you enable them) may use platform-specific services (e.g. Apple Push Notification service). We do not use these for tracking.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Your rights</h2>
        <p>
          You can download your data (Settings → Data &amp; Privacy → Download My Data) and delete your account (Settings → Data &amp; Privacy → Delete My Account) at any time. Account deletion removes your profile and all check-in data.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
        <p>
          For privacy-related questions, contact us at the support email listed in the app or on the App Store listing.
        </p>

        <p className="mt-12 pt-6 border-t border-cardBorder">
          <Link href="/" className="text-primary hover:underline">
            Back to Life-Lag
          </Link>
        </p>
      </div>
    </main>
  );
}
