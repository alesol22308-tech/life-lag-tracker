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
    if (!result.milestone) return;
    
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
    if (!result.milestone) return;
    
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
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </main>
    );
  }

  const streakMessage = formatStreakMessage(result.streakCount);
  const milestoneMessage = result.milestone
    ? formatMilestoneMessage(result.milestone.milestoneType, result.milestone.milestoneValue)
    : null;

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Score, Category, Continuity, Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card space-y-8"
        >
          {/* Score */}
          <div className="text-center space-y-4">
            <div className="text-7xl sm:text-8xl font-light text-gray-900 dark:text-gray-100">
              {result.lagScore}
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-400 space-y-2">
              <div>Lag Score</div>
              <div>
                <WhyThisWorksLink href="/science#why-lag-score" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="text-center">
            <div className="inline-block px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-lg text-slate-700 dark:text-slate-300">
                {CATEGORY_LABELS[result.driftCategory]}
              </span>
            </div>
          </div>

          {/* Recovery Message */}
          {result.recoveryMessage && (
            <div className="text-center pt-2">
              <p className="text-base text-emerald-600 dark:text-emerald-400 font-medium">
                {result.recoveryMessage}
              </p>
            </div>
          )}

          {/* Continuity Message */}
          {result.continuityMessage && (
            <div className="text-center pt-2">
              <p className="text-base text-gray-600 dark:text-gray-400 italic">
                {result.continuityMessage}
              </p>
            </div>
          )}

          {/* Streak Indicator */}
          {streakMessage && (
            <div className="text-center pt-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {streakMessage}
              </p>
            </div>
          )}

          {/* Milestone */}
          {milestoneMessage && (
            <div className="text-center pt-2 space-y-2">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                {milestoneMessage}
              </p>
              {/* Milestone Share */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleShareMilestoneLink}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  Copy text
                </button>
                <button
                  onClick={handleShareMilestoneImage}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  Download image
                </button>
              </div>
            </div>
          )}

          {/* Focus Area */}
          <div className="text-center space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Focus Area</div>
            <div className="text-xl text-gray-900 dark:text-gray-100 font-medium">
              {DIMENSION_LABELS[result.weakestDimension]}
            </div>
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}
          className="card space-y-6"
        >
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Your Tip</h2>
          
          <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-xl">{result.tip.focus}</div>
              <p className="text-gray-700 dark:text-gray-300">{result.tip.constraint}</p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">{result.tip.choice}</p>
            </div>
          </div>

          {/* Reassurance Message */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-base text-gray-600 dark:text-gray-400 italic">
              {result.reassuranceMessage}
            </p>
          </div>
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
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-4 transition-colors duration-200"
            >
              Lock this in for the week?
            </button>
          </motion.div>
        ) : showLockInNudge && !showLockIn ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 max-w-md mx-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Set a weekly check-in reminder to stay on track
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLockIn(true)}
                  className="px-3 py-1.5 text-xs bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors duration-200"
                >
                  Set reminder
                </button>
                <button
                  onClick={handleDismissNudge}
                  className="px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors duration-200"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="card space-y-4 max-w-md mx-auto"
          >
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">Choose when you&apos;ll do this (optional)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lockin-day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day
                </label>
                <select
                  id="lockin-day"
                  value={lockInDay}
                  onChange={(e) => setLockInDay(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-transparent"
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
                <label htmlFor="lockin-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  id="lockin-time"
                  type="time"
                  value={lockInTime}
                  onChange={(e) => setLockInTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSaveLockIn}
                disabled={savingLockIn}
                className="px-4 py-2 text-sm bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 shadow-soft"
              >
                {savingLockIn ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleDismissLockIn}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/settings"
            className="px-6 py-3 text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Settings
          </Link>
          <Link
            href="/home"
            className="px-6 py-3 text-center bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 shadow-soft"
          >
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
