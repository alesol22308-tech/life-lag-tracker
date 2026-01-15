'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface ProgressThinProps {
  value: number; // 0-100
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}

export default function ProgressThin({ 
  value, 
  className = '',
  height = 'md'
}: ProgressThinProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const heightClasses = {
    sm: 'h-0.5',
    md: 'h-1',
    lg: 'h-1.5',
  };

  return (
    <div className={`w-full ${heightClasses[height]} bg-white/5 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 0.4,
          ease: 'easeOut'
        }}
        className={`h-full bg-gradient-to-r from-white/20 to-white/30 rounded-full`}
        style={{
          boxShadow: '0 0 8px rgba(255, 255, 255, 0.2)',
        }}
      />
    </div>
  );
}
