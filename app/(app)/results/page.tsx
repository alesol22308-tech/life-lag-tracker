'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckinResult, DriftCategory } from '@/types';
import { formatStreakMessage } from '@/lib/streaks';
import { formatMilestoneMessage } from '@/lib/milestones';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';
import WhyThisWorksLink from '@/components/WhyThisWorksLink';

const CATEGORY_LABELS: Record<DriftCategory, string> = {
  aligned: 'Aligned',
  mild: 'Mild Drift',
  moderate: 'Moderate Drift',
  heavy: 'Heavy Drift',
  critical: 'Critical Drift',
};

const DIMENSION_LABELS: Record<string, string> = {
  energy: 'Energy',
  sleep: 'Sleep consistency',
  structure: 'Daily structure',
  initiation: 'Task initiation',
  engagement: 'Engagement / follow-through',
  sustainability: 'Effort sustainability',
};

export default function ResultsPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [showLockIn, setShowLockIn] = useState(false);
  const [lockInDay, setLockInDay] = useState('');
  const [lockInTime, setLockInTime] = useState('');
  const [savingLockIn, setSavingLockIn] = useState(false);
  const [lockInDismissed, setLockInDismissed] = useState(false);
  const [showLockInNudge, setShowLockInNudge] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = sessionStorage.getItem('checkinResult');
      if (stored) {
        const parsedResult = JSON.parse(stored);
        setResult(parsedResult);
        sessionStorage.removeItem('checkinResult');
        
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

  const handleSaveLockIn = async () => {
    if (!lockInDay && !lockInTime) {
      setShowLockIn(false);
      // Mark as dismissed if user skips without setting values
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('lockInDismissed', 'true');
      }
      setLockInDismissed(true);
      setShowLockInNudge(true);
      return;
    }

    setSavingLockIn(true);
    try {
      const response = await fetch('/api/reflection/lock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredCheckinDay: lockInDay || null,
          preferredCheckinTime: lockInTime || null,
        }),
      });

      if (response.ok) {
        setShowLockIn(false);
        // Clear dismissed flag if user sets preferences
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('lockInDismissed');
        }
        setLockInDismissed(false);
        setShowLockInNudge(false);
      }
    } catch (error) {
      console.error('Error saving lock-in:', error);
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
      alert('Milestone copied to clipboard!');
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
    ctx.fillText('🎉 Milestone Achieved!', canvas.width / 2, 120);
    
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
          <div className="text-text1">Loading...</div>
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
                <div>Lag Score</div>
                <div>
                  <WhyThisWorksLink href="/science#why-lag-score" />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="text-center">
              <div className="inline-block px-6 py-3 bg-white/5 rounded-lg border border-cardBorder">
                <span className="text-lg text-text0">
                  {CATEGORY_LABELS[result.driftCategory]}
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
                    aria-label="Copy milestone text to clipboard"
                    className="text-xs px-3 py-1.5"
                  >
                    Copy text
                  </GhostButton>
                  <GhostButton
                    onClick={handleShareMilestoneImage}
                    aria-label="Download milestone image"
                    className="text-xs px-3 py-1.5"
                  >
                    Download image
                  </GhostButton>
                </div>
              </div>
            )}

            {/* Focus Area */}
            <div className="text-center space-y-2 pt-4 border-t border-cardBorder">
              <div className="text-sm text-text2 uppercase tracking-wide">Focus Area</div>
              <div className="text-xl text-text0 font-medium">
                {DIMENSION_LABELS[result.weakestDimension]}
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
            <h2 className="text-2xl font-semibold text-text0">Your Tip</h2>
            
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
        {!showLockIn && !showLockInNudge ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.4 }}
            className="text-center"
          >
            <button
              onClick={() => setShowLockIn(true)}
              aria-label="Set weekly check-in reminder"
              className="text-sm text-text2 hover:text-text1 underline underline-offset-4 transition-colors duration-200"
            >
              Lock this in for the week?
            </button>
          </motion.div>
        ) : showLockInNudge && !showLockIn ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="max-w-md mx-auto"
          >
            <GlassCard className="bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-text1">
                    Set a weekly check-in reminder to stay on track
                  </p>
                </div>
                <div className="flex gap-2">
                  <PrimaryButton
                    onClick={() => setShowLockIn(true)}
                    aria-label="Set weekly check-in reminder"
                    className="text-xs px-3 py-1.5"
                  >
                    Set reminder
                  </PrimaryButton>
                  <button
                    onClick={handleDismissNudge}
                    className="px-3 py-1.5 text-xs text-text2 hover:text-text1 transition-colors duration-200"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="max-w-md mx-auto"
          >
            <GlassCard className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-text1">Choose when you&apos;ll do this (optional)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lockin-day" className="block text-sm font-medium text-text1 mb-2">
                    Day
                  </label>
                  <select
                    id="lockin-day"
                    value={lockInDay}
                    onChange={(e) => setLockInDay(e.target.value)}
                    className="w-full px-4 py-2 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                  >
                    <option value="">Not set</option>
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
                  <label htmlFor="lockin-time" className="block text-sm font-medium text-text1 mb-2">
                    Time
                  </label>
                  <input
                    id="lockin-time"
                    type="time"
                    value={lockInTime}
                    onChange={(e) => setLockInTime(e.target.value)}
                    className="w-full px-4 py-2 border border-cardBorder rounded-lg bg-white/5 text-text0 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <PrimaryButton
                  onClick={handleSaveLockIn}
                  disabled={savingLockIn}
                  aria-label={savingLockIn ? 'Saving reminder' : 'Save reminder'}
                  className="text-sm"
                >
                  {savingLockIn ? 'Saving...' : 'Save'}
                </PrimaryButton>
                <GhostButton
                  onClick={handleDismissLockIn}
                  aria-label="Skip reminder"
                  className="text-sm"
                >
                  Skip
                </GhostButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/settings" className="block">
            <GhostButton className="w-full sm:w-auto">
              Settings
            </GhostButton>
          </Link>
          <Link href="/home" className="block">
            <PrimaryButton className="w-full sm:w-auto">
              Return to Dashboard
            </PrimaryButton>
          </Link>
        </motion.div>
      </div>
    </AppShell>
  );
}
