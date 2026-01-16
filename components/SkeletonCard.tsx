'use client';

import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';

interface SkeletonCardProps {
  className?: string;
  height?: string;
  lines?: number;
}

export default function SkeletonCard({ 
  className = '', 
  height = 'auto',
  lines = 3 
}: SkeletonCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <GlassCard className={className} hover={false}>
      <div style={{ height }} className="space-y-3">
        {/* Header line (wider) */}
        <div 
          className={`h-6 bg-white/10 rounded-lg ${prefersReducedMotion ? '' : 'animate-pulse'}`}
          style={{ 
            width: '60%',
            animation: prefersReducedMotion ? 'none' : undefined,
          }}
        />
        
        {/* Body lines */}
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-white/10 rounded-lg ${prefersReducedMotion ? '' : 'animate-pulse'}`}
            style={{ 
              width: i === lines - 2 ? '80%' : '100%',
              animationDelay: prefersReducedMotion ? undefined : `${i * 0.1}s`,
              animation: prefersReducedMotion ? 'none' : undefined,
            }}
          />
        ))}
      </div>
    </GlassCard>
  );
}
