'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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

export default function CheckinPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (value: number) => {
    const question = QUESTIONS[currentQuestion];
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 200);
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
        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(((currentQuestion + 1) / QUESTIONS.length) * 100)}%</span>
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
            <h1 className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-gray-100 leading-tight">
              {question.label}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {question.description}
            </p>
          </div>

          {/* Scale */}
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
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
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {isLastQuestion && (
              <div className="flex flex-col items-end gap-2">
                <WhyThisWorksLink href="/science#why-weekly-checkin" />
                <button
                  onClick={handleSubmit}
                  disabled={currentAnswer === undefined || loading}
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
