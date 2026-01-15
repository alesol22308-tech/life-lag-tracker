import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DarkModeInit from '@/components/DarkModeInit';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Life Lag - Preventative Self-Maintenance',
  description: 'Detect early life drift before patterns shift',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.variable}>
        <DarkModeInit />
        {children}
      </body>
    </html>
  );
}
