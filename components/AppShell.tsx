'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function AppShell({ children, showNav = true }: AppShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/home', label: 'Dashboard' },
    { href: '/checkin', label: 'Check-in' },
    { href: '/trends', label: 'Trends' },
    { href: '/history', label: 'History' },
    { href: '/science', label: 'Science' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {showNav && (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-bg0/80 border-b border-cardBorder">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Branding */}
              <Link 
                href="/home" 
                className="text-xl font-semibold text-text0 hover:text-text1 transition-colors"
              >
                Life Lag
              </Link>

              {/* Navigation Pills */}
              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href === '/home' && pathname === '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        px-4 py-2 text-sm font-medium rounded-full transition-all duration-200
                        ${isActive
                          ? 'bg-white/10 text-text0 border border-cardBorder'
                          : 'text-text2 hover:text-text1 hover:bg-white/5'
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
