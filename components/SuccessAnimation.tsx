'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface SuccessAnimationProps {
  /** Animation variant: 'celebration' for check-in completion, 'milestone' for achievements */
  variant: 'celebration' | 'milestone';
  /** Whether to show the animation */
  show: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Subtle success animation component
 * Respects user's reduced motion preference
 */
export default function SuccessAnimation({
  variant,
  show,
  onComplete,
  className = '',
}: SuccessAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  // Don't render anything if reduced motion is preferred
  if (prefersReducedMotion) {
    return null;
  }

  const particles = variant === 'celebration' 
    ? generateCelebrationParticles() 
    : generateMilestoneParticles();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={onComplete}
        >
          {particles.map((particle, index) => (
            <motion.div
              key={index}
              className="absolute"
              initial={particle.initial}
              animate={particle.animate}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              style={{
                left: particle.left,
                top: particle.top,
              }}
            >
              <span 
                className="text-lg"
                style={{ 
                  opacity: particle.opacity,
                  filter: `blur(${particle.blur}px)`,
                }}
              >
                {particle.emoji}
              </span>
            </motion.div>
          ))}

          {/* Central glow effect */}
          {variant === 'celebration' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 1.4] }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              <div 
                className="w-32 h-32 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                }}
              />
            </motion.div>
          )}

          {/* Milestone sparkle ring */}
          {variant === 'milestone' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.3, 1.5], rotate: 45 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            >
              <div 
                className="w-40 h-40 rounded-full border-2 border-emerald-400/30"
                style={{
                  boxShadow: '0 0 20px rgba(52, 211, 153, 0.2)',
                }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface Particle {
  emoji: string;
  left: string;
  top: string;
  initial: { opacity: number; y: number; scale: number };
  animate: { opacity: number[]; y: number; scale: number };
  duration: number;
  delay: number;
  opacity: number;
  blur: number;
}

function generateCelebrationParticles(): Particle[] {
  const emojis = ['✨', '🌟', '💫', '⭐'];
  const particles: Particle[] = [];

  // Create 8 subtle particles floating up
  for (let i = 0; i < 8; i++) {
    particles.push({
      emoji: emojis[i % emojis.length],
      left: `${20 + Math.random() * 60}%`,
      top: `${60 + Math.random() * 20}%`,
      initial: { opacity: 0, y: 0, scale: 0.5 },
      animate: { opacity: [0, 0.6, 0], y: -100 - Math.random() * 50, scale: 1 },
      duration: 1.5 + Math.random() * 0.5,
      delay: Math.random() * 0.3,
      opacity: 0.7,
      blur: 0,
    });
  }

  return particles;
}

function generateMilestoneParticles(): Particle[] {
  const emojis = ['🎉', '✨', '🏆', '🌟'];
  const particles: Particle[] = [];

  // Create 6 particles radiating outward from center
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const radius = 100 + Math.random() * 50;
    
    particles.push({
      emoji: emojis[i % emojis.length],
      left: '50%',
      top: '40%',
      initial: { opacity: 0, y: 0, scale: 0.3 },
      animate: { 
        opacity: [0, 0.8, 0], 
        y: Math.sin(angle) * radius, 
        scale: 1.2 
      },
      duration: 1.8 + Math.random() * 0.4,
      delay: i * 0.1,
      opacity: 0.8,
      blur: 0,
    });
  }

  return particles;
}
