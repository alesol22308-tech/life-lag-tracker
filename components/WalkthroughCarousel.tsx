'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface WalkthroughSlide {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
}

export default function WalkthroughCarousel() {
  const prefersReducedMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides: WalkthroughSlide[] = [
    {
      id: 1,
      title: 'Weekly Check-In',
      description: 'Answer 6 simple questions about your week',
      content: (
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg border border-cardBorder p-6 shadow-glowSm space-y-8">
            {/* Mock question */}
            <div className="space-y-4">
              <h3 className="text-2xl font-light text-text0">Energy</h3>
              <p className="text-text1">Mental and physical energy levels</p>
            </div>
            
            {/* Mock scale */}
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <div
                  key={value}
                  className={`py-4 px-3 rounded-lg border text-center transition-all ${
                    value === 3
                      ? 'border-white/30 bg-white/10 text-text0 shadow-glowSm'
                      : 'border-cardBorder bg-transparent text-text1'
                  }`}
                >
                  <div className="text-lg font-medium">{value}</div>
                  <div className="text-xs mt-1">
                    {value === 1 ? 'Very off' : value === 3 ? 'Neutral' : value === 5 ? 'Fully aligned' : ''}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-text2">
                <span>Question 1 of 6</span>
                <span>17%</span>
              </div>
              <div className="w-full bg-cardBorder h-1 rounded-full overflow-hidden">
                <div className="bg-text0 h-full" style={{ width: '17%' }} />
              </div>
            </div>
          </div>
          <p className="text-sm text-text2 text-center">
            Quick questions about energy, sleep, structure, and more
          </p>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Get Your Lag Score',
      description: 'See your drift category and personalized insights',
      content: (
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg border border-cardBorder p-8 shadow-glowSm space-y-6">
            {/* Lag Score */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-light text-text0">72</div>
              <div className="text-lg text-text1">Lag Score</div>
            </div>
            
            {/* Category */}
            <div className="text-center">
              <div className="inline-block px-6 py-3 bg-white/10 rounded-lg border border-white/20">
                <span className="text-lg text-text0">Mild Drift</span>
              </div>
            </div>
            
            {/* Tip */}
            <div className="pt-4 border-t border-cardBorder">
              <div className="text-sm text-text2 uppercase tracking-wide mb-2">Your Tip</div>
              <p className="text-text1">
                Consider adjusting your sleep schedule to improve consistency this week.
              </p>
            </div>
          </div>
          <p className="text-sm text-text2 text-center">
            Receive actionable feedback based on your responses
          </p>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Track Your Progress',
      description: 'View trends and maintain your streak',
      content: (
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg border border-cardBorder p-6 shadow-glowSm space-y-4">
            {/* Mock chart area */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-text0">Lag Score Trend</h3>
              <div className="h-32 bg-black/20 rounded-lg flex items-end justify-around gap-2 p-3">
                {[60, 65, 70, 68, 72, 75].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/60 rounded-t"
                    style={{ height: `${(height / 80) * 100}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-text2 text-center">Last 6 weeks</p>
            </div>
            
            {/* Streak indicator */}
            <div className="pt-4 border-t border-cardBorder text-center">
              <div className="text-sm text-text1">
                <span className="font-medium">4 week</span> streak
              </div>
            </div>
          </div>
          <p className="text-sm text-text2 text-center">
            See how your baseline changes over time
          </p>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Quick Pulse Interventions',
      description: 'Get timely prompts when you need them most',
      content: (
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg border border-cardBorder p-6 shadow-glowSm space-y-4">
            {/* Mock Quick Pulse card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-medium text-text0">Quick Pulse Check</h3>
              </div>
              <div className="p-4 bg-amber-400/10 border border-amber-400/30 rounded-lg">
                <p className="text-sm text-text1 mb-2">
                  Noticing a drift in <strong>Energy</strong> this week?
                </p>
                <p className="text-xs text-text2">
                  Take a quick 30-second check-in to recalibrate
                </p>
              </div>
              <div className="text-xs text-text2 text-center">
                Appears mid-week when patterns suggest you might benefit
              </div>
            </div>
          </div>
          <p className="text-sm text-text2 text-center">
            Smart prompts help you catch drift early, between weekly check-ins
          </p>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Personalized Tips',
      description: 'Get actionable advice tailored to your patterns',
      content: (
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg border border-cardBorder p-6 shadow-glowSm space-y-4">
            {/* Mock tip card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-medium text-text0">Your Personalized Tip</h3>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-text1 leading-relaxed">
                  Based on your energy patterns, try adjusting your sleep schedule by 30 minutes earlier this week. Small shifts prevent larger drift.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-text2 pt-2 border-t border-cardBorder">
                <span>✓ Tips adapt to your feedback</span>
                <span>✓ Focused on your weakest dimension</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-text2 text-center">
            Tips get smarter as you provide feedback on what works for you
          </p>
        </div>
      ),
    },
    {
      id: 6,
      title: 'Works Offline',
      description: 'Check in anytime, anywhere - even without internet',
      content: (
        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg border border-cardBorder p-6 shadow-glowSm space-y-4">
            {/* Mock offline indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">📶</span>
                <h3 className="text-lg font-medium text-text0">Offline Mode</h3>
              </div>
              <div className="p-4 bg-white/5 rounded-lg text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-text2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Online - All data synced</span>
                </div>
                <div className="text-xs text-text2 pt-2 border-t border-cardBorder">
                  When offline, your check-ins are saved locally and sync automatically when you reconnect
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text2">
                <div className="p-2 bg-white/5 rounded text-center">
                  <div className="font-medium text-text1">✓ Save locally</div>
                </div>
                <div className="p-2 bg-white/5 rounded text-center">
                  <div className="font-medium text-text1">✓ Auto-sync</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-text2 text-center">
            Never miss a check-in, even when connectivity is limited
          </p>
        </div>
      ),
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || prefersReducedMotion) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, prefersReducedMotion, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  return (
    <div
      className="w-full"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative backdrop-blur-sm bg-card border border-cardBorder rounded-20 shadow-glowSm p-6 sm:p-8" style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)' }}>
        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="space-y-4"
          >
            {/* Step indicator */}
            <div className="text-center text-sm text-text2">
              Step {currentSlide + 1} of {slides.length}
            </div>

            {/* Title and description */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-light text-text0">
                {slides[currentSlide].title}
              </h3>
              <p className="text-lg text-text1">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* Slide content */}
            <div className="py-4">
              {slides[currentSlide].content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prevSlide}
            className="px-4 py-2 text-text2 hover:text-text0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            disabled={currentSlide === 0}
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-200 rounded-full ${
                  index === currentSlide
                    ? 'bg-text0 w-8 h-2'
                    : 'bg-white/20 w-2 h-2 hover:bg-white/30'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="px-4 py-2 text-text2 hover:text-text0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            disabled={currentSlide === slides.length - 1}
            aria-label={currentSlide === slides.length - 1 ? 'Last slide' : 'Next slide'}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
