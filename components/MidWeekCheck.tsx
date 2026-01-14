'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface MidWeekCheckProps {
  hasCheckinThisWeek: boolean;
}

type FeelingOption = 'on track' | 'adjusting' | 'overwhelmed';

export default function MidWeekCheck({ hasCheckinThisWeek }: MidWeekCheckProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedFeeling, setSelectedFeeling] = useState<FeelingOption | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Only show if user has checked in this week
  if (!hasCheckinThisWeek) {
    return null;
  }

  const handleSelect = (feeling: FeelingOption) => {
    setSelectedFeeling(feeling);
    setIsComplete(true);
  };

  if (isComplete) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      className="card"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">How&apos;s the week feeling?</h3>
        
        <div className="flex flex-col gap-3">
          {(['on track', 'adjusting', 'overwhelmed'] as FeelingOption[]).map((feeling) => (
            <button
              key={feeling}
              onClick={() => handleSelect(feeling)}
              className="px-4 py-3 text-left border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:border-slate-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <span className="text-base text-gray-700 dark:text-gray-300 capitalize">{feeling}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
