import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life Lag - Preventative Self-Maintenance',
  description: 'Detect early life drift before burnout or collapse occurs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
