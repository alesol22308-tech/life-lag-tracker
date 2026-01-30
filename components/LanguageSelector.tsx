'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { Locale } from '@/lib/i18n';

interface LanguageSelectorProps {
  className?: string;
  showFlags?: boolean;
  variant?: 'dropdown' | 'buttons';
}

export default function LanguageSelector({
  className = '',
  showFlags = true,
  variant = 'dropdown',
}: LanguageSelectorProps) {
  const { locale, setLocale, locales, localeLabels, localeFlags } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = async (newLocale: Locale) => {
    console.log('[LanguageSelector] Changing language to:', newLocale);
    setIsOpen(false);
    
    // Update locale (saves to localStorage only)
    await setLocale(newLocale);
    console.log('[LanguageSelector] Language preference updated to:', newLocale);
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              locale === loc
                ? 'bg-white/20 text-text0 border border-white/20'
                : 'bg-white/5 text-text2 hover:bg-white/10 hover:text-text1 border border-transparent'
            }`}
          >
            {showFlags && <span className="mr-2">{localeFlags[loc]}</span>}
            {localeLabels[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent flex items-center justify-between"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          {showFlags && <span>{localeFlags[locale]}</span>}
          {localeLabels[locale]}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg1 border border-cardBorder rounded-lg shadow-lg overflow-hidden">
          <ul role="listbox" className="py-1">
            {locales.map((loc) => (
              <li key={loc}>
                <button
                  onClick={() => handleLocaleChange(loc)}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-white/10 transition-colors ${
                    locale === loc ? 'bg-white/5 text-text0' : 'text-text1'
                  }`}
                  role="option"
                  aria-selected={locale === loc}
                >
                  {showFlags && <span>{localeFlags[loc]}</span>}
                  <span>{localeLabels[loc]}</span>
                  {locale === loc && (
                    <svg className="w-4 h-4 ml-auto text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
