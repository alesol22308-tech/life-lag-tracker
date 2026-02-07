'use client';

import { useTheme } from '@/lib/hooks/useTheme';
import { Theme } from '@/lib/theme';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Theme toggle control component
 * Allows users to switch between system, light, and dark themes
 */
export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: '💻' },
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
  ];

  return (
    <div className={`space-y-3 ${className}`} role="radiogroup" aria-label="Theme selection">
      {themeOptions.map((option) => (
        <label
          key={option.value}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            theme === option.value
              ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20'
              : 'bg-black/5 dark:bg-white/5 border-cardBorder hover:border-black/15 dark:hover:border-white/15'
          }`}
        >
          <input
            type="radio"
            name="theme"
            value={option.value}
            checked={theme === option.value}
            onChange={() => setTheme(option.value)}
            className="sr-only"
            aria-label={`${option.label} theme`}
          />
          <span className="text-lg" aria-hidden="true">{option.icon}</span>
          <span className="text-text0 text-sm font-medium">{option.label}</span>
          {theme === option.value && (
            <span className="ml-auto text-text1 text-xs">Active</span>
          )}
        </label>
      ))}
    </div>
  );
}
