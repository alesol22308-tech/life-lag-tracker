'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function GhostButton({ 
  children, 
  className = '',
  ...props 
}: GhostButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={!prefersReducedMotion ? { 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.15)'
      } : {}}
      whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
      className={`
        px-6 py-3
        bg-transparent
        border border-cardBorder
        text-text1
        font-medium
        rounded-lg
        transition-all duration-200
        hover:bg-white/5
        hover:border-white/15
        focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-bg0
        disabled:opacity-30 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}
