'use client';

import { useTranslations } from 'next-intl';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/GlassCard';

export default function HelpPage() {
  const t = useTranslations('help');
  const tScale = useTranslations('scale');

  const scaleItems = [1, 2, 3, 4, 5] as const;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0 mb-4">{t('titleShortcuts')}</h1>
          <p className="text-text2 text-sm">{t('subtitleEfficient')}</p>
        </div>

        <GlassCard>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-text0">{t('shortcutsTitle')}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-text0 mb-2">{t('checkinPage')}</h3>
                <ul className="space-y-2 text-sm text-text1">
                  {scaleItems.map((value) => (
                    <li key={value} className="flex items-start gap-3">
                      <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">
                        {value}
                      </kbd>
                      <span className="flex-1">{t('selectScale', { value, label: tScale(String(value) as '1' | '2' | '3' | '4' | '5') })}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">←</kbd>
                    <span className="flex-1">{t('prevQuestion')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">→</kbd>
                    <span className="flex-1">{t('nextQuestion')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">Enter</kbd>
                    <span className="flex-1">{t('submitOnLast')}</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-cardBorder">
                <h3 className="text-lg font-medium text-text0 mb-2">{t('globalShortcuts')}</h3>
                <ul className="space-y-2 text-sm text-text1">
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">Esc</kbd>
                    <span className="flex-1">{t('closeModals')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 border border-cardBorder rounded text-text0 font-mono text-xs">Tab</kbd>
                    <span className="flex-1">{t('tabNavigate')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-text0">{t('accessibilityTitle')}</h2>
            <ul className="space-y-2 text-sm text-text1 list-disc list-inside">
              <li>{t('a11y1')}</li>
              <li>{t('a11y2')}</li>
              <li>{t('a11y3')}</li>
              <li>{t('a11y4')}</li>
              <li>{t('a11y5')}</li>
              <li>{t('a11y6')}</li>
            </ul>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-text0">{t('tipsTitle')}</h2>
            <ul className="space-y-2 text-sm text-text1 list-disc list-inside">
              <li>{t('tip1')}</li>
              <li>{t('tip2')}</li>
              <li>{t('tip3')}</li>
              <li>{t('tip4')}</li>
              <li>{t('tip5')}</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
