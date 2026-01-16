/**
 * Accessibility utilities for contrast checking and theme management
 */

/**
 * Calculate contrast ratio between two colors (WCAG 2.1)
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text, 3:1 for large text)
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard (7:1 for normal text, 4.5:1 for large text)
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Apply high contrast mode classes to document
 */
export function applyHighContrastMode(enabled: boolean): void {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  if (enabled) {
    html.classList.add('high-contrast');
  } else {
    html.classList.remove('high-contrast');
  }
}

/**
 * Apply font size preference to document
 */
export function applyFontSizePreference(size: 'default' | 'large' | 'extra-large'): void {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  html.setAttribute('data-font-size', size);
}

/**
 * Get current font size preference from document
 */
export function getFontSizePreference(): 'default' | 'large' | 'extra-large' {
  if (typeof document === 'undefined') return 'default';

  const html = document.documentElement;
  const size = html.getAttribute('data-font-size');
  if (size === 'large' || size === 'extra-large') {
    return size;
  }
  return 'default';
}

/**
 * Get current high contrast mode state from document
 */
export function getHighContrastMode(): boolean {
  if (typeof document === 'undefined') return false;

  const html = document.documentElement;
  return html.classList.contains('high-contrast');
}
