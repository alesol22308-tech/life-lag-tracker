'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Answers } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import WhyThisWorksLink from '@/components/WhyThisWorksLink';

const QUESTIONS: Array<{ key: keyof Answers; label: string; description: string }> = [
  {
    key: 'energy',
    label: 'Energy',
    description: 'Mental and physical energy levels',
  },
  {
    key: 'sleep',
    label: 'Sleep consistency',
    description: 'How consistent your sleep has been',
  },
  {
    key: 'structure',
    label: 'Daily structure',
    description: 'How structured your days feel',
  },
  {
    key: 'initiation',
    label: 'Task initiation',
    description: 'Ease of starting tasks',
  },
  {
    key: 'engagement',
    label: 'Engagement / follow-through',
    description: 'Ability to stay engaged and complete tasks',
  },
  {
    key: 'sustainability',
    label: 'Effort sustainability',
    description: 'How sustainable your current effort level feels',
  },
];

const SCALE_LABELS = {
  1: 'Very off',
  2: 'Somewhat off',
  3: 'Neutral',
  4: 'Mostly aligned',
  5: 'Fully aligned',
};

interface SavedCheckinState {
  answers: Partial<Answers>;
  currentQuestion: number;
  lastUpdated: number;
}

export default function CheckinPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [hasSavedState, setHasSavedState] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const SESSION_STORAGE_KEY = 'checkinInProgress';

  // Save state to sessionStorage
  const saveStateToStorage = (answersToSave: Partial<Answers>, questionIndex: number) => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const state: SavedCheckinState = {
        answers: answersToSave,
        currentQuestion: questionIndex,
        lastUpdated: Date.now(),
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    }
  };

  // Load state from sessionStorage
  const loadStateFromStorage = (): SavedCheckinState | null => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        try {
          const state: SavedCheckinState = JSON.parse(saved);
          // Check if state is not expired (within 24 hours)
          const twentyFourHours = 24 * 60 * 60 * 1000;
          if (Date.now() - state.lastUpdated < twentyFourHours) {
            return state;
          }
        } catch (error) {
          console.error('Error loading saved check-in state:', error);
        }
      }
    }
    return null;
  };

  // Clear saved state
  const clearSavedState = () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadStateFromStorage();
    if (savedState && Object.keys(savedState.answers).length > 0) {
      setHasSavedState(true);
      setShowResumePrompt(true);
    }
  }, []);

  // Save state whenever answers or currentQuestion changes (but not on initial mount if no saved state)
  useEffect(() => {
    // Only save if there are answers or we're past the first question
    // This prevents saving empty state when starting fresh
    if (Object.keys(answers).length > 0 || currentQuestion > 0) {
      saveStateToStorage(answers, currentQuestion);
    }
  }, [answers, currentQuestion]);

  const handleResume = () => {
    const savedState = loadStateFromStorage();
    if (savedState) {
      setAnswers(savedState.answers);
      setCurrentQuestion(savedState.currentQuestion);
      setShowResumePrompt(false);
    }
  };

  const handleStartNew = () => {
    clearSavedState();
    setAnswers({});
    setCurrentQuestion(0);
    setHasSavedState(false);
    setShowResumePrompt(false);
  };

  const handleAnswer = (value: number) => {
    const question = QUESTIONS[currentQuestion];
    const newAnswers = { ...answers, [question.key]: value };
    setAnswers(newAnswers);
    
    if (autoAdvanceEnabled && currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 400);
    }
  };

  const handleSkip = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all answers
    const allAnswered = QUESTIONS.every((q) => answers[q.key] !== undefined);
    if (!allAnswered) {
      alert('Please answer all questions');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit check-in');
      }

      const result = await response.json();
      
      // Store result in sessionStorage for results page
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('checkinResult', JSON.stringify(result));
      }
      
      // Clear saved check-in state after successful submission
      clearSavedState();
      
      router.push('/results');
    } catch (error: any) {
      alert(error.message || 'An error occurred');
      setLoading(false);
    }
  };

  const question = QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
  const currentAnswer = answers[question.key];

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Return to Dashboard */}
        <div className="mb-8">
          <Link
            href="/home"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Return to Dashboard
          </Link>
        </div>
        
        {/* Resume Prompt */}
        {showResumePrompt && hasSavedState && (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Incomplete check-in found
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You have a saved check-in in progress. Would you like to resume?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResume}
                  aria-label="Resume incomplete check-in"
                  className="px-4 py-2 text-sm bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors duration-200"
                >
                  Resume
                </button>
                <button
                  onClick={handleStartNew}
                  aria-label="Start new check-in"
                  className="px-4 py-2 text-sm border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-200"
                >
                  Start New
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs">Auto-advance</span>
              <button
                onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  autoAdvanceEnabled ? 'bg-slate-700 dark:bg-slate-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={autoAdvanceEnabled}
                aria-label="Toggle auto-advance to next question"
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    autoAdvanceEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span>{Math.round(((currentQuestion + 1) / QUESTIONS.length) * 100)}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
            <motion.div
              className="bg-gray-900 dark:bg-gray-100 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <h1 id={`question-${currentQuestion}`} className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-gray-100 leading-tight">
              {question.label}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {question.description}
            </p>
          </div>

          {/* Scale */}
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4" role="radiogroup" aria-labelledby={`question-${currentQuestion}`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  aria-label={`Select ${value}, ${SCALE_LABELS[value as keyof typeof SCALE_LABELS]}`}
                  aria-pressed={currentAnswer === value}
                  className={`py-6 px-4 rounded-lg border-2 transition-all duration-200 ${
                    currentAnswer === value
                      ? 'border-slate-700 dark:border-slate-500 bg-slate-700 dark:bg-slate-600 text-white shadow-soft'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-soft'
                  }`}
                >
                  <div className="text-2xl font-medium mb-2">{value}</div>
                  <div className="text-xs">{SCALE_LABELS[value as keyof typeof SCALE_LABELS]}</div>
                </button>
              ))}
            </div>
            
            {/* Skip Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSkip}
                aria-label="Skip this question"
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
              >
                Skip for now
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              aria-label="Go to previous question"
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {!isLastQuestion && !autoAdvanceEnabled && (
              <button
                onClick={handleNext}
                aria-label="Go to next question"
                className="px-6 py-3 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                Next
              </button>
            )}

            {isLastQuestion && (
              <div className="flex flex-col items-end gap-2">
                <WhyThisWorksLink href="/science#why-weekly-checkin" />
                <button
                  onClick={handleSubmit}
                  disabled={currentAnswer === undefined || loading}
                  aria-label={loading ? 'Submitting check-in' : 'Submit check-in'}
                  className="px-8 py-4 bg-slate-700 dark:bg-slate-600 text-white text-lg font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
