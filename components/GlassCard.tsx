'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export default function GlassCard({ 
  children, 
  className = '', 
  hover = true,
  padding = 'md'
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      whileHover={hover && !prefersReducedMotion ? { 
        y: -1, 
        borderColor: 'rgba(255, 255, 255, 0.15)',
        boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)'
      } : {}}
      className={`
        backdrop-blur-sm 
        bg-card 
        border border-cardBorder 
        rounded-20 
        shadow-glowSm
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
