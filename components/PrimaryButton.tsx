'use client';

import { ReactNode, ComponentPropsWithoutRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

type PrimaryButtonProps = ComponentPropsWithoutRef<typeof motion.button> & {
  children: ReactNode;
  className?: string;
};

export default function PrimaryButton({ 
  children, 
  className = '',
  ...props 
}: PrimaryButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={!prefersReducedMotion ? { 
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)'
      } : {}}
      whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
      className={`
        px-6 py-3
        bg-transparent
        border border-cardBorder
        text-text0
        font-medium
        rounded-lg
        transition-all duration-200
        hover:border-black/30 dark:hover:border-white/30
        focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-bg0
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.05)',
      }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
