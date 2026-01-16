'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function AppShell({ children, showNav = true }: AppShellProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const navItems = [
    { href: '/home', label: 'Dashboard', icon: '📊' },
    { href: '/checkin', label: 'Check-in', icon: '✓' },
    { href: '/trends', label: 'Trends', icon: '📈' },
    { href: '/history', label: 'History', icon: '📅' },
    { href: '/science', label: 'Science', icon: '🔬' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  const handleNavClick = (href: string) => {
    setPendingPath(href);
    setIsMenuOpen(false);
  };
  
  // Clear pending path when navigation completes
  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  return (
    <div className="min-h-screen relative z-10">
      {showNav && (
        <>
          {/* Top Navigation Bar */}
          <nav className="sticky top-0 z-50 backdrop-blur-md bg-bg0/80 border-b border-cardBorder">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Left Side - Menu button */}
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-lg text-text0 hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="Toggle menu"
                  aria-expanded={isMenuOpen}
                >
                  <svg
                    className="w-6 h-6 transition-transform duration-200"
                    style={{ transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                {/* Logo/Branding */}
                <Link 
                  href="/home" 
                  className="text-xl font-semibold text-text0 hover:text-text1 transition-colors"
                >
                  Life Lag
                </Link>

                {/* Right Side - Spacer */}
                <div className="w-10"></div>
              </div>
            </div>
          </nav>

          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200 ${
              isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Collapsible Side Menu */}
          <aside
            className={`
              fixed top-0 left-0 h-full w-72 bg-bg0/95 backdrop-blur-lg 
              border-r border-cardBorder z-50
              transform transition-transform duration-200 ease-out
              ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-cardBorder">
                <h2 className="text-lg font-semibold text-text0">Menu</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-lg text-text2 hover:text-text0 hover:bg-white/10 transition-colors duration-150"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === '/home' && pathname === '/');
                    const isPending = pendingPath === item.href;
                    const shouldHighlight = isActive || isPending;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => handleNavClick(item.href)}
                          prefetch={true}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                            transition-[background-color,color,border-color] duration-150 group
                            ${shouldHighlight
                              ? 'bg-white/10 text-text0 border border-cardBorder shadow-sm'
                              : 'text-text2 hover:text-text0 hover:bg-white/5'
                            }
                          `}
                        >
                          <span className="text-xl">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {shouldHighlight && (
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Menu Footer */}
              <div className="p-4 border-t border-cardBorder">
                <div className="text-xs text-text2 text-center">
                  Life Lag © 2026
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
