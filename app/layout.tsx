import type { Metadata } from 'next';
import './globals.css';
import DarkModeInit from '@/components/DarkModeInit';

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
    <html lang="en">
      <body>
        <DarkModeInit />
        {children}
      </body>
    </html>
  );
}
