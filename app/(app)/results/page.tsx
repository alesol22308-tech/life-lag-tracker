'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckinResult, DriftCategory } from '@/types';

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

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-16">
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

          {/* Focus Area */}
          <div className="text-center space-y-2">
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
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
