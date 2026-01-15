'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { QuickPulseResponse, DimensionName } from '@/types';
import { getMicroAdjustment, dismissQuickPulse } from '@/lib/quickPulse';
import GlassCard from '@/components/GlassCard';
import Link from 'next/link';

interface QuickPulseProps {
  weakestDimension: DimensionName;
  currentScore: number;
}

export default function QuickPulse({ weakestDimension, currentScore }: QuickPulseProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedResponse, setSelectedResponse] = useState<QuickPulseResponse | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleSelect = (response: QuickPulseResponse) => {
    setSelectedResponse(response);
  };

  const handleDismiss = () => {
    dismissQuickPulse();
    setIsDismissed(true);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  // Show adjustment after selection
  if (selectedResponse) {
    const adjustment = getMicroAdjustment(selectedResponse, weakestDimension, currentScore);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      >
        <GlassCard>
          <div className="space-y-4 text-center py-4">
            <div className="text-2xl">✓</div>
            <p className="text-lg font-medium text-text0">
              {adjustment.message}
            </p>
            
            {adjustment.actionLabel && adjustment.actionLink && (
              <Link href={adjustment.actionLink}>
                <button className="px-6 py-2 text-sm font-medium text-text0 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200">
                  {adjustment.actionLabel}
                </button>
              </Link>
            )}

            <button
              onClick={handleDismiss}
              className="text-sm text-text2 hover:text-text1 transition-colors duration-200 mt-2"
            >
              Got it
            </button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // Main Quick Pulse question
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
    >
      <GlassCard>
        <div className="space-y-6 py-2">
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-text0">
                Quick Pulse
              </h3>
              <button
                onClick={handleDismiss}
                className="text-xs text-text2 hover:text-text1 transition-colors duration-200"
                aria-label="Dismiss Quick Pulse"
              >
                Not now
              </button>
            </div>
            <p className="text-base text-text1">
              Is this week still on track?
            </p>
          </div>

          {/* Response Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleSelect('good')}
              className="group relative px-6 py-4 text-center border border-cardBorder bg-white/5 rounded-xl hover:border-white/30 hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              <div className="text-xl mb-1">👍</div>
              <span className="text-base font-medium text-text0">Yes, good</span>
            </button>

            <button
              onClick={() => handleSelect('adjusting')}
              className="group relative px-6 py-4 text-center border border-cardBorder bg-white/5 rounded-xl hover:border-white/30 hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              <div className="text-xl mb-1">🔄</div>
              <span className="text-base font-medium text-text0">Adjusting</span>
            </button>

            <button
              onClick={() => handleSelect('struggling')}
              className="group relative px-6 py-4 text-center border border-cardBorder bg-white/5 rounded-xl hover:border-white/30 hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              <div className="text-xl mb-1">😓</div>
              <span className="text-base font-medium text-text0">Struggling</span>
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
