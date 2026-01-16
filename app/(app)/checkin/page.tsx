'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Answers } from '@/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';
import ProgressThin from '@/components/ProgressThin';
import StatChip from '@/components/StatChip';
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
  reflectionNote?: string;
}

export default function CheckinPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const supabase = createClient();
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [hasSavedState, setHasSavedState] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [reflectionNote, setReflectionNote] = useState('');

  const SESSION_STORAGE_KEY = 'checkinInProgress';

  // Save state to sessionStorage
  const saveStateToStorage = (answersToSave: Partial<Answers>, questionIndex: number, reflection?: string) => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const state: SavedCheckinState = {
        answers: answersToSave,
        currentQuestion: questionIndex,
        lastUpdated: Date.now(),
        reflectionNote: reflection,
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

  // Load saved state and auto-advance preference on mount
  useEffect(() => {
    async function loadSettings() {
      // Load saved check-in state
      const savedState = loadStateFromStorage();
      if (savedState && Object.keys(savedState.answers).length > 0) {
        setHasSavedState(true);
        setShowResumePrompt(true);
      }

      // Load auto-advance preference from database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('auto_advance_enabled')
            .eq('id', user.id)
            .single();

          if (!error && data?.auto_advance_enabled !== undefined) {
            setAutoAdvanceEnabled(data.auto_advance_enabled);
          }
        }
      } catch (error) {
        console.error('Error loading auto-advance preference:', error);
      }
    }

    loadSettings();
  }, [supabase]);

  // Save state whenever answers or currentQuestion changes (but not on initial mount if no saved state)
  useEffect(() => {
    // Only save if there are answers or we're past the first question
    // This prevents saving empty state when starting fresh
    if (Object.keys(answers).length > 0 || currentQuestion > 0 || reflectionNote) {
      saveStateToStorage(answers, currentQuestion, reflectionNote);
    }
  }, [answers, currentQuestion, reflectionNote]);

  // Keyboard navigation handler
  useEffect(() => {
    if (showResumePrompt) return; // Don't handle keyboard when resume prompt is shown

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Number keys 1-5 select scale values
      if (e.key >= '1' && e.key <= '5') {
        const value = parseInt(e.key);
        const question = QUESTIONS[currentQuestion];
        const newAnswers = { ...answers, [question.key]: value };
        setAnswers(newAnswers);
        
        if (autoAdvanceEnabled && currentQuestion < QUESTIONS.length - 1) {
          setTimeout(() => setCurrentQuestion(currentQuestion + 1), 400);
        }
        e.preventDefault();
        return;
      }

      // Arrow keys navigate between questions
      if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1);
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowRight' && currentQuestion < QUESTIONS.length - 1) {
        if (answers[QUESTIONS[currentQuestion].key] !== undefined || !autoAdvanceEnabled) {
          setCurrentQuestion(currentQuestion + 1);
          e.preventDefault();
        }
        return;
      }

      // Enter submits on last question
      if (e.key === 'Enter' && currentQuestion === QUESTIONS.length - 1) {
        const currentAns = answers[QUESTIONS[currentQuestion].key];
        if (currentAns !== undefined && !loading) {
          handleSubmit();
          e.preventDefault();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, answers, autoAdvanceEnabled, loading, showResumePrompt]);

  const handleResume = () => {
    const savedState = loadStateFromStorage();
    if (savedState) {
      setAnswers(savedState.answers);
      setCurrentQuestion(savedState.currentQuestion);
      setReflectionNote(savedState.reflectionNote || '');
      setShowResumePrompt(false);
    }
  };

  const handleStartNew = () => {
    clearSavedState();
    setAnswers({});
    setCurrentQuestion(0);
    setReflectionNote('');
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
        body: JSON.stringify({ 
          answers,
          reflectionNote: reflectionNote.trim() || undefined,
        }),
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
  const progressPercent = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-semibold text-text0">Weekly Check-In</h1>
          <p className="text-lg text-text1">Answer 6 simple questions about your week</p>
        </div>

        {/* Resume Prompt */}
        {showResumePrompt && hasSavedState && (
          <GlassCard>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text0 mb-1">
                  Incomplete check-in found
                </p>
                <p className="text-xs text-text2">
                  You have a saved check-in in progress. Would you like to resume?
                </p>
              </div>
              <div className="flex gap-2">
                <PrimaryButton
                  onClick={handleResume}
                  aria-label="Resume incomplete check-in"
                  className="text-sm px-4 py-2"
                >
                  Resume
                </PrimaryButton>
                <GhostButton
                  onClick={handleStartNew}
                  aria-label="Start new check-in"
                  className="text-sm px-4 py-2"
                >
                  Start New
                </GhostButton>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main Question Card */}
          <div className="lg:col-span-2">
            <GlassCard padding="lg">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                className="space-y-8"
              >
                {/* Question */}
                <div className="space-y-3">
                  <h2 id={`question-${currentQuestion}`} className="text-3xl sm:text-4xl font-semibold text-text0 leading-tight">
                    {question.label}
                  </h2>
                  <p className="text-lg text-text1">
                    {question.description}
                  </p>
                </div>

                {/* Scale - Compact with subtle ticks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2" role="radiogroup" aria-labelledby={`question-${currentQuestion}`}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleAnswer(value)}
                        aria-label={`Select ${value}, ${SCALE_LABELS[value as keyof typeof SCALE_LABELS]}`}
                        aria-pressed={currentAnswer === value}
                        className={`
                          flex-1 flex flex-col items-center justify-center
                          py-4 px-2
                          rounded-lg
                          border transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-white/30
                          ${currentAnswer === value
                            ? 'border-white/30 bg-white/10 shadow-glowSm'
                            : 'border-cardBorder bg-transparent hover:border-white/20 hover:bg-white/5'
                          }
                        `}
                      >
                        <div className={`text-2xl font-medium mb-1 ${currentAnswer === value ? 'text-text0' : 'text-text1'}`}>
                          {value}
                        </div>
                        <div className={`text-xs text-center ${currentAnswer === value ? 'text-text0' : 'text-text2'}`}>
                          {SCALE_LABELS[value as keyof typeof SCALE_LABELS]}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Skip Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleSkip}
                      aria-label="Skip this question"
                      className="text-sm text-text2 hover:text-text1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2 py-1"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>

                {/* Reflection Note - Only on last question */}
                {isLastQuestion && (
                  <div className="space-y-3 pt-6 border-t border-cardBorder">
                    <div className="space-y-2">
                      <label htmlFor="reflection-note" className="block text-sm font-medium text-text1">
                        Reflection (Optional)
                      </label>
                      <p className="text-xs text-text2">
                        Add a quick note about this week if you&apos;d like
                      </p>
                    </div>
                    <div className="space-y-2">
                      <textarea
                        id="reflection-note"
                        value={reflectionNote}
                        onChange={(e) => setReflectionNote(e.target.value.slice(0, 200))}
                        placeholder="E.g., &apos;Great week at work but sleep was off&apos; or &apos;Felt productive today&apos;"
                        maxLength={200}
                        rows={3}
                        className="w-full px-4 py-3 border border-cardBorder rounded-lg bg-white/5 text-text0 placeholder:text-text2 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-end">
                        <span className={`text-xs ${reflectionNote.length >= 200 ? 'text-amber-400' : 'text-text2'}`}>
                          {reflectionNote.length}/200
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation - Right aligned inside card */}
                <div className="flex justify-end items-center gap-4 pt-6 border-t border-cardBorder">
                  <GhostButton
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    aria-label="Go to previous question"
                    className="text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    Back
                  </GhostButton>

                  {!isLastQuestion && !autoAdvanceEnabled && (
                    <PrimaryButton
                      onClick={handleNext}
                      aria-label="Go to next question"
                      className="text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      Next
                    </PrimaryButton>
                  )}

                  {isLastQuestion && (
                    <div className="flex flex-col items-end gap-2">
                      <WhyThisWorksLink href="/science#why-weekly-checkin" />
                      <PrimaryButton
                        onClick={handleSubmit}
                        disabled={currentAnswer === undefined || loading}
                        aria-label={loading ? 'Submitting check-in' : 'Submit check-in'}
                        className="text-base px-8 py-3 focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        {loading ? 'Submitting...' : 'Submit'}
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </motion.div>
            </GlassCard>
          </div>

          {/* Right: Stacked Modules */}
          <div className="space-y-4">
            {/* Progress Module */}
            <GlassCard padding="md">
              <div className="space-y-3">
                <StatChip label="Question" value={`${currentQuestion + 1} of ${QUESTIONS.length}`} />
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-text2">
                    <span>Progress</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <ProgressThin value={progressPercent} />
                </div>
              </div>
            </GlassCard>

            {/* Helper Text Module */}
            <GlassCard padding="md">
              <p className="text-sm text-text2 leading-relaxed">
                Quick questions about energy, sleep, structure, and engagement to help detect early life drift.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
