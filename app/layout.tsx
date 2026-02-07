import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Analytics } from "@vercel/analytics/next"
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Life Lag - Preventative Self-Maintenance',
    template: '%s | Life Lag',
  },
  description: 'Detect early life drift before patterns shift. A 3-minute weekly check-in that calculates your Lag Score and delivers personalized, actionable tips for maintaining your baseline.',
  keywords: ['life lag', 'self-maintenance', 'mental health', 'wellness', 'check-in', 'lag score', 'preventative care', 'life tracking', 'wellbeing', 'mindfulness'],
  authors: [{ name: 'Life Lag' }],
  creator: 'Life Lag',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Life Lag' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lifelag.app',
    siteName: 'Life Lag',
    title: 'Life Lag - Preventative Self-Maintenance',
    description: 'Detect early life drift before patterns shift. A 3-minute weekly check-in that calculates your Lag Score and delivers personalized, actionable tips.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Life Lag - Preventative Self-Maintenance' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Life Lag - Preventative Self-Maintenance',
    description: 'Detect early life drift before patterns shift. A 3-minute weekly check-in that calculates your Lag Score.',
    images: ['/og-image.png'],
    creator: '@lifelag',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lifelag.app'),
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('life-lag-theme');var r=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t==='dark';document.documentElement.classList.toggle('dark',r);})();`,
          }}
        />
        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Life Lag',
              applicationCategory: 'HealthApplication',
              operatingSystem: 'Web',
              description: 'Detect early life drift before patterns shift. A 3-minute weekly check-in that calculates your Lag Score and delivers personalized, actionable tips for maintaining your baseline.',
              url: 'https://lifelag.app',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              featureList: [
                'Weekly check-in questions',
                'Lag Score calculation',
                'Personalized tips',
                'Trend visualization',
                'Offline support',
              ],
            }),
          }}
        />
      </head>
      <body className={inter.variable}>
        {/* Skip to main content link for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg0 focus:text-text0 focus:rounded focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30"
        >
          Skip to main content
        </a>
        <ErrorBoundary fallbackMessage="Something went wrong loading the app. Please refresh the page.">
          <ThemeProvider>
            {children}
            <Analytics />
            <ServiceWorkerRegistration />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
// fixed duplicate RootLayout export
