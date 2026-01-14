'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface ExpandableSectionProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function ExpandableSection({
  summary,
  children,
  defaultOpen = false,
  className = '',
}: ExpandableSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer flex items-center justify-between gap-2 py-1"
        aria-expanded={isOpen}
      >
        <span>{summary}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
