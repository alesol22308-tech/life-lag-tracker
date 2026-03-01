'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { CheckinResult } from '@/types';
import { formatStreakMessage } from '@/lib/streaks';
import { formatMilestoneMessage } from '@/lib/milestones';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { getDimensionName, getDriftCategoryName, type Locale } from '@/lib/i18n';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';
import WhyThisWorksLink from '@/components/WhyThisWorksLink';
import SuccessAnimation from '@/components/SuccessAnimation';

export default function ResultsPage() {
  const locale = useLocale();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations('results');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [showLockIn, setShowLockIn] = useState(false);
  const [lockInDay, setLockInDay] = useState('');
  const [lockInTime, setLockInTime] = useState('');
  const [savingLockIn, setSavingLockIn] = useState(false);
  const [lockInDismissed, setLockInDismissed] = useState(false);
  const [showLockInNudge, setShowLockInNudge] = useState(false);
  const [lockInError, setLockInError] = useState<string | null>(null);
  const [showLockInSuccess, setShowLockInSuccess] = useState(false);
  const [lockInSavedSummary, setLockInSavedSummary] = useState<{ day: string | null; time: string | null } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMilestoneAnimation, setShowMilestoneAnimation] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = sessionStorage.getItem('checkinResult');
      if (stored) {
        const parsedResult = JSON.parse(stored);
        setResult(parsedResult);
        sessionStorage.removeItem('checkinResult');
        
        // Trigger celebration animation after a short delay
        setTimeout(() => {
          setShowCelebration(true);
        }, 300);
        
        // Auto-hide celebration after animation completes
        setTimeout(() => {
          setShowCelebration(false);
        }, 2000);
        
        // Check if there's a milestone to celebrate
        if (parsedResult.milestone) {
          setTimeout(() => {
            setShowMilestoneAnimation(true);
          }, 800);
          
          // Auto-hide milestone animation
          setTimeout(() => {
            setShowMilestoneAnimation(false);
          }, 3000);
        }
        
        // Check if lock-in was dismissed previously
        const dismissed = localStorage.getItem('lockInDismissed') === 'true';
        setLockInDismissed(dismissed);
        
        // Show nudge if lock-in was dismissed and user hasn't set preferences
        if (dismissed) {
          // Show nudge after a short delay
          setTimeout(() => {
            setShowLockInNudge(true);
          }, 3000);
        }
      } else {
        // If no result, redirect to check-in
        router.push('/checkin');
      }
    } else {
      // If sessionStorage is unavailable, redirect to check-in
      router.push('/checkin');
    }
  }, [router]);

  const openLockInForm = () => {
    setLockInError(null);
    setShowLockIn(true);
    fetch('/api/settings/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.preferredCheckinDay != null || data.preferredCheckinTime != null)) {
          setLockInDay(data.preferredCheckinDay ?? '');
          setLockInTime(data.preferredCheckinTime ?? '');
        }
      })
      .catch(() => { /* leave existing state */ });
  };

  const handleSaveLockIn = async () => {
    setLockInError(null);
    const day = lockInDay || null;
    const time = lockInTime || null;

    setSavingLockIn(true);
    try {
      const response = await fetch('/api/reflection/lock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredCheckinDay: day,
          preferredCheckinTime: time,
        }),
      });

      const body = await response.json().catch(() => ({}));
      const errorMessage = typeof body?.error === 'string' ? body.error : tCommon('error');

      if (response.ok) {
        setShowLockIn(false);
        if (day || time) {
          setLockInSavedSummary({ day, time });
          setShowLockInSuccess(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('lockInDismissed');
          }
          setLockInDismissed(false);
          setShowLockInNudge(false);
          setTimeout(() => {
            setShowLockInSuccess(false);
            setLockInSavedSummary(null);
          }, 1800);
        } else {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('lockInDismissed', 'true');
          }
          setLockInDismissed(true);
          setTimeout(() => setShowLockInNudge(true), 2000);
        }
      } else {
        setLockInError(errorMessage);
      }
    } catch (error) {
      console.error('Error saving lock-in:', error);
      setLockInError(tCommon('error'));
    } finally {
      setSavingLockIn(false);
    }
  };

  const handleDismissLockIn = () => {
    setShowLockIn(false);
    // Mark as dismissed
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('lockInDismissed', 'true');
    }
    setLockInDismissed(true);
    // Show nudge after a delay
    setTimeout(() => {
      setShowLockInNudge(true);
    }, 2000);
  };

  const handleDismissNudge = () => {
    setShowLockInNudge(false);
  };

  const handleShareMilestoneLink = async () => {
    if (!result || !result.milestone) return;
    
    // Generate shareable text (privacy-preserving)
    const shareText = `🎉 ${milestoneMessage || 'Milestone achieved!'}\n\nFrom Life-Lag - Weekly life drift detection`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      // Could show a toast/notification here
      alert(t('milestoneCopied'));
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback: show text for manual copy
      alert(`Copy this: ${shareText}`);
    }
  };

  const handleShareMilestoneImage = async () => {
    if (!result || !result.milestone) return;
    
    // Create canvas element for image generation
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🎉 ${t('milestone')}`, canvas.width / 2, 120);
    
    // Milestone message
    ctx.fillStyle = '#059669';
    ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
    const messageLines = (milestoneMessage || '').split('\n');
    messageLines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, 200 + (index * 50));
    });
    
    // Footer
    ctx.fillStyle = '#6b7280';
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Life-Lag - Weekly life drift detection', canvas.width / 2, 340);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `milestone-${result.milestone?.milestoneType}-${result.milestone?.milestoneValue}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  if (!result) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-text1">{tCommon('loading')}</div>
        </div>
      </AppShell>
    );
  }

  const streakMessage = formatStreakMessage(result.streakCount);
  const milestoneMessage = result.milestone
    ? formatMilestoneMessage(result.milestone.milestoneType, result.milestone.milestoneValue)
    : null;

  return (
    <AppShell>
      {/* Success Animations */}
      <SuccessAnimation variant="celebration" show={showCelebration} />
      <SuccessAnimation variant="milestone" show={showMilestoneAnimation} />
      
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Score, Category, Continuity, Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard padding="lg" className="space-y-8">
            {/* Score */}
            <div className="text-center space-y-4">
              <div className="text-7xl sm:text-8xl font-light text-text0">
                {result.lagScore}
              </div>
              <div className="text-xl text-text1 space-y-2">
                <div>{t('lagScore')}</div>
                <div>
                  <WhyThisWorksLink href="/science#why-lag-score" />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="text-center">
              <div className="inline-block px-6 py-3 bg-black/5 dark:bg-white/5 rounded-lg border border-cardBorder">
                <span className="text-lg text-text0">
                  {getDriftCategoryName(result.driftCategory, locale as Locale)}
                </span>
              </div>
            </div>

            {/* Recovery Message */}
            {result.recoveryMessage && (
              <div className="text-center pt-2">
                <p className="text-base text-emerald-400 font-medium">
                  {result.recoveryMessage}
                </p>
              </div>
            )}

            {/* Continuity Message */}
            {result.continuityMessage && (
              <div className="text-center pt-2">
                <p className="text-base text-text1 italic">
                  {result.continuityMessage}
                </p>
              </div>
            )}

            {/* Streak Indicator */}
            {streakMessage && (
              <div className="text-center pt-2">
                <p className="text-sm text-text1 font-medium">
                  {streakMessage}
                </p>
              </div>
            )}

            {/* Milestone */}
            {milestoneMessage && (
              <div className="text-center pt-2 space-y-2">
                <p className="text-sm text-emerald-400 font-medium">
                  {milestoneMessage}
                </p>
                {/* Milestone Share */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <GhostButton
                    onClick={handleShareMilestoneLink}
                    aria-label={t('copyText')}
                    className="text-xs px-3 py-1.5"
                  >
                    {t('copyText')}
                  </GhostButton>
                  <GhostButton
                    onClick={handleShareMilestoneImage}
                    aria-label={t('downloadImage')}
                    className="text-xs px-3 py-1.5"
                  >
                    {t('downloadImage')}
                  </GhostButton>
                </div>
              </div>
            )}

            {/* Focus Area */}
            <div className="text-center space-y-2 pt-4 border-t border-cardBorder">
              <div className="text-sm text-text2 uppercase tracking-wide">{t('focusArea')}</div>
              <div className="text-xl text-text0 font-medium">
                {getDimensionName(result.weakestDimension, locale as Locale)}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Adaptive Tip Message */}
        {result.adaptiveTipMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.15 }}
          >
            <GlassCard>
              <p className="text-sm text-text1 italic">
                {result.adaptiveTipMessage}
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <h2 className="text-2xl font-semibold text-text0">{t('yourTip')}</h2>
            
            <div className="space-y-6 text-lg text-text1 leading-relaxed">
              <div>
                <div className="font-medium text-text0 mb-3 text-xl">{result.tip.focus}</div>
                <p className="text-text1">{result.tip.constraint}</p>
              </div>
              <div>
                <p className="text-text1">{result.tip.choice}</p>
              </div>
            </div>

            {/* Reassurance Message */}
            <div className="pt-4 border-t border-cardBorder">
              <p className="text-base text-text1 italic">
                {result.reassuranceMessage}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Reflection Lock-In (Optional) */}
        {!showLockIn && !showLockInNudge && !showLockInSuccess ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.4 }}
            className="max-w-md mx-auto pt-2"
          >
            <GlassCard padding="lg" className="text-center space-y-4">
              <p className="text-sm text-text1">
                {t('getWeeklyReminder')}
              </p>
              <PrimaryButton
                onClick={openLockInForm}
                aria-label={t('setReminder')}
                className="text-sm"
              >
                {t('setReminder')}
              </PrimaryButton>
            </GlassCard>
          </motion.div>
        ) : showLockInSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="max-w-md mx-auto pt-2"
          >
            <GlassCard padding="lg" className="text-center space-y-3">
              <div aria-live="polite" className="space-y-2">
                <p className="text-lg text-text0 font-medium">
                  {lockInSavedSummary && (lockInSavedSummary.day || lockInSavedSummary.time)
                    ? `✓ Reminder set for ${[lockInSavedSummary.day, lockInSavedSummary.time].filter(Boolean).join(' at ')}`
                    : '✓ Reminder set'}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ) : showLockInNudge && !showLockIn ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="max-w-md mx-auto pt-2"
          >
            <GlassCard className="bg-black/5 dark:bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text1">{t('getWeeklyReminder')}</p>
                  <p className="text-xs text-text2 mt-1">{t('getWeeklyReminder')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <PrimaryButton
                    onClick={openLockInForm}
                    aria-label={t('setReminder')}
                    className="text-xs px-3 py-1.5"
                  >
                    {t('setReminder')}
                  </PrimaryButton>
                  <GhostButton
                    onClick={handleDismissNudge}
                    aria-label={t('notNow')}
                    className="text-xs px-3 py-1.5"
                  >
                    {t('notNow')}
                  </GhostButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : showLockIn ? (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0, y: 10 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="max-w-md mx-auto pt-2"
          >
            <GlassCard padding="lg" className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-base font-medium text-text0">{t('whenRemind')}</p>
                <p className="text-xs text-text2">{t('getWeeklyReminder')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lockin-day" className="block text-sm font-medium text-text1 mb-1">
                    {t('day')}
                  </label>
                  <p className="text-xs text-text2 mb-2">Your preferred day</p>
                  <select
                    id="lockin-day"
                    value={lockInDay}
                    onChange={(e) => setLockInDay(e.target.value)}
                    className="w-full px-4 py-2 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent"
                  >
                    <option value="">{t('noPreference')}</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="lockin-time" className="block text-sm font-medium text-text1 mb-1">
                    {t('time')}
                  </label>
                  <p className="text-xs text-text2 mb-2">Your preferred time</p>
                  <input
                    id="lockin-time"
                    type="time"
                    value={lockInTime}
                    onChange={(e) => setLockInTime(e.target.value)}
                    className="w-full px-4 py-2 border border-cardBorder rounded-lg bg-black/5 dark:bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-3 justify-center">
                  <PrimaryButton
                    onClick={handleSaveLockIn}
                    disabled={savingLockIn}
                    aria-label={savingLockIn ? t('savingReminder') : t('setReminder')}
                    className="text-sm"
                  >
                    {savingLockIn ? t('savingReminder') : t('setReminder')}
                  </PrimaryButton>
                  <GhostButton
                    onClick={handleDismissLockIn}
                    aria-label={t('notNow')}
                    className="text-sm"
                  >
                    {t('notNow')}
                  </GhostButton>
                </div>
                {lockInError && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="text-sm text-red-500 dark:text-red-400 text-center"
                  >
                    {lockInError}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ) : null}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/settings" className="block">
            <GhostButton className="w-full sm:w-auto">
              {tNav('settings')}
            </GhostButton>
          </Link>
          <Link href="/home" className="block">
            <PrimaryButton className="w-full sm:w-auto">
              {t('returnToDashboard')}
            </PrimaryButton>
          </Link>
        </motion.div>
      </div>
    </AppShell>
  );
}
