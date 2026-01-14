'use client';

import { useState, useEffect } from 'react';
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-soft space-y-8">
            {/* Mock question */}
            <div className="space-y-4">
              <h3 className="text-2xl font-light text-gray-900">Energy</h3>
              <p className="text-gray-600">Mental and physical energy levels</p>
            </div>
            
            {/* Mock scale */}
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <div
                  key={value}
                  className={`py-4 px-3 rounded-lg border-2 text-center ${
                    value === 3
                      ? 'border-slate-700 bg-slate-700 text-white'
                      : 'border-gray-300 bg-white text-gray-700'
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
              <div className="flex justify-between text-sm text-gray-500">
                <span>Question 1 of 6</span>
                <span>17%</span>
              </div>
              <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                <div className="bg-gray-900 h-full" style={{ width: '17%' }} />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
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
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-soft space-y-6">
            {/* Lag Score */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-light text-gray-900">72</div>
              <div className="text-lg text-gray-600">Lag Score</div>
            </div>
            
            {/* Category */}
            <div className="text-center">
              <div className="inline-block px-6 py-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-lg text-slate-700">Mild Drift</span>
              </div>
            </div>
            
            {/* Tip */}
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">Your Tip</div>
              <p className="text-gray-700">
                Consider adjusting your sleep schedule to improve consistency this week.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-soft space-y-4">
            {/* Mock chart area */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Lag Score Trend</h3>
              <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-around gap-2 p-3">
                {[60, 65, 70, 68, 72, 75].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-slate-700 rounded-t"
                    style={{ height: `${(height / 80) * 100}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">Last 6 weeks</p>
            </div>
            
            {/* Streak indicator */}
            <div className="pt-4 border-t border-gray-100 text-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">4 week</span> streak
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            See how your baseline changes over time
          </p>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

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
  }, [isAutoPlaying, currentSlide, prefersReducedMotion]);

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
  }, []);

  return (
    <div
      className="w-full"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative bg-white rounded-lg border border-gray-200 shadow-soft p-6 sm:p-8">
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
            <div className="text-center text-sm text-gray-500">
              Step {currentSlide + 1} of {slides.length}
            </div>

            {/* Title and description */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-light text-gray-900">
                {slides[currentSlide].title}
              </h3>
              <p className="text-lg text-gray-600">
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
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                    ? 'bg-slate-700 w-8 h-2'
                    : 'bg-gray-300 w-2 h-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            disabled={currentSlide === slides.length - 1}
            aria-label="Next slide"
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
