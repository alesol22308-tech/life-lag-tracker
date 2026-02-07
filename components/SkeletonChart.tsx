'use client';

import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import GlassCard from '@/components/GlassCard';

interface SkeletonChartProps {
  className?: string;
  height?: string;
}

export default function SkeletonChart({ 
  className = '', 
  height = '300px' 
}: SkeletonChartProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <GlassCard className={className} hover={false}>
      {/* Chart header skeleton */}
      <div className="mb-4 space-y-2">
        <div 
          className={`h-6 bg-black/10 dark:bg-white/10 rounded-lg ${prefersReducedMotion ? '' : 'animate-pulse'}`}
          style={{ 
            width: '40%',
            animation: prefersReducedMotion ? 'none' : undefined,
          }}
        />
        <div 
          className={`h-4 bg-black/10 dark:bg-white/10 rounded-lg ${prefersReducedMotion ? '' : 'animate-pulse'}`}
          style={{ 
            width: '60%',
            animationDelay: prefersReducedMotion ? undefined : '0.1s',
            animation: prefersReducedMotion ? 'none' : undefined,
          }}
        />
      </div>

      {/* Chart area skeleton */}
      <div 
        className="relative bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden"
        style={{ height }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i}
              className="h-px bg-black/5 dark:bg-white/5"
              style={{ 
                width: '100%',
              }}
            />
          ))}
        </div>

        {/* Bar/line chart skeleton - shows mock bars */}
        <div className="absolute inset-0 flex items-end justify-around gap-2 px-4 py-4">
          {Array.from({ length: 6 }).map((_, i) => {
            const barHeight = `${Math.random() * 60 + 30}%`;
            return (
              <div
                key={i}
                className={`flex-1 bg-black/20 dark:bg-white/20 rounded-t ${prefersReducedMotion ? '' : 'animate-pulse'}`}
                style={{ 
                  height: barHeight,
                  animationDelay: prefersReducedMotion ? undefined : `${i * 0.1}s`,
                  animation: prefersReducedMotion ? 'none' : undefined,
                }}
              />
            );
          })}
        </div>

        {/* X-axis labels skeleton */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-4 pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 bg-black/10 dark:bg-white/10 rounded ${prefersReducedMotion ? '' : 'animate-pulse'}`}
              style={{ 
                width: '20%',
                animationDelay: prefersReducedMotion ? undefined : `${i * 0.1}s`,
                animation: prefersReducedMotion ? 'none' : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
