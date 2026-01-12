'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckinResult, DriftCategory } from '@/types';
import { formatStreakMessage } from '@/lib/streaks';
import { formatMilestoneMessage } from '@/lib/milestones';

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
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [showLockIn, setShowLockIn] = useState(false);
  const [lockInDay, setLockInDay] = useState('');
  const [lockInTime, setLockInTime] = useState('');
  const [savingLockIn, setSavingLockIn] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('checkinResult');
    if (stored) {
      setResult(JSON.parse(stored));
      sessionStorage.removeItem('checkinResult');
    } else {
      // If no result, redirect to check-in
      router.push('/checkin');
    }
  }, [router]);

  const handleSaveLockIn = async () => {
    if (!lockInDay && !lockInTime) {
      setShowLockIn(false);
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
      }
    } catch (error) {
      console.error('Error saving lock-in:', error);
    } finally {
      setSavingLockIn(false);
    }
  };

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  const streakMessage = formatStreakMessage(result.streakCount);
  const milestoneMessage = result.milestone
    ? formatMilestoneMessage(result.milestone.milestoneType, result.milestone.milestoneValue)
    : null;

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-16">
        {/* Score, Category, Continuity, Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Score */}
          <div className="text-center space-y-4">
            <div className="text-6xl sm:text-7xl font-light text-gray-900">
              {result.lagScore}
            </div>
            <div className="text-xl text-gray-600">Lag Score</div>
          </div>

          {/* Category */}
          <div className="text-center">
            <div className="inline-block px-6 py-3 bg-gray-100 rounded-sm">
              <span className="text-lg text-gray-900">
                {CATEGORY_LABELS[result.driftCategory]}
              </span>
            </div>
          </div>

          {/* Continuity Message */}
          {result.continuityMessage && (
            <div className="text-center">
              <p className="text-base text-gray-600 italic">
                {result.continuityMessage}
              </p>
            </div>
          )}

          {/* Streak Indicator */}
          {streakMessage && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {streakMessage}
              </p>
            </div>
          )}

          {/* Focus Area */}
          <div className="text-center space-y-2 pt-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Focus Area</div>
            <div className="text-xl text-gray-700">
              {DIMENSION_LABELS[result.weakestDimension]}
            </div>
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-8 pt-8 border-t border-gray-200"
        >
          <div className="space-y-6">
            <h2 className="text-2xl font-light text-gray-900">Your Tip</h2>
            
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <div>
                <div className="font-medium text-gray-900 mb-2">{result.tip.focus}</div>
                <p className="text-gray-700">{result.tip.constraint}</p>
              </div>
              <div>
                <p className="text-gray-700">{result.tip.choice}</p>
              </div>
            </div>
          </div>

          {/* Reassurance Message */}
          <div className="pt-4">
            <p className="text-base text-gray-600 italic">
              {result.reassuranceMessage}
            </p>
          </div>
        </motion.div>

        {/* Milestone */}
        {milestoneMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center pt-4"
          >
            <p className="text-sm text-gray-500">
              {milestoneMessage}
            </p>
          </motion.div>
        )}

        {/* Reflection Lock-In (Optional) */}
        {!showLockIn ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center pt-8"
          >
            <button
              onClick={() => setShowLockIn(true)}
              className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors duration-200"
            >
              Lock this in for the week?
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-8 space-y-4 max-w-md mx-auto"
          >
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700">Choose when you'll do this (optional)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lockin-day" className="block text-sm font-medium text-gray-700 mb-2">
                  Day
                </label>
                <select
                  id="lockin-day"
                  value={lockInDay}
                  onChange={(e) => setLockInDay(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                <label htmlFor="lockin-time" className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  id="lockin-time"
                  type="time"
                  value={lockInTime}
                  onChange={(e) => setLockInTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSaveLockIn}
                disabled={savingLockIn}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                {savingLockIn ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowLockIn(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
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
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
        >
          <Link
            href="/settings"
            className="px-6 py-3 text-center border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors duration-200"
          >
            Settings
          </Link>
          <Link
            href="/"
            className="px-6 py-3 text-center bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition-colors duration-200"
          >
            Done
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
