'use client';

import { useState } from 'react';
import GlassCard from './GlassCard';

interface TipFeedbackPromptProps {
  onFeedback: (feedback: 'helpful' | 'didnt_try' | 'not_relevant') => void;
  onDismiss?: () => void;
}

export default function TipFeedbackPrompt({ onFeedback, onDismiss }: TipFeedbackPromptProps) {
  const [selected, setSelected] = useState<'helpful' | 'didnt_try' | 'not_relevant' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (value: 'helpful' | 'didnt_try' | 'not_relevant') => {
    setSelected(value);
    setSubmitting(true);
    onFeedback(value);
  };

  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text0 mb-2">
            How did last week&apos;s tip work?
          </h3>
          <p className="text-sm text-text2">
            Your feedback helps us personalize future tips
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleSelect('helpful')}
            disabled={submitting}
            className={`
              flex-1 px-4 py-3 rounded-lg border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white/30
              ${selected === 'helpful'
                ? 'border-white/30 bg-white/10 shadow-glowSm'
                : 'border-cardBorder bg-transparent hover:border-white/20 hover:bg-white/5'
              }
              ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label="Tip was helpful"
          >
            <span className="text-lg mb-1 block">👍</span>
            <span className="text-sm font-medium text-text0">Helpful</span>
          </button>

          <button
            onClick={() => handleSelect('didnt_try')}
            disabled={submitting}
            className={`
              flex-1 px-4 py-3 rounded-lg border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white/30
              ${selected === 'didnt_try'
                ? 'border-white/30 bg-white/10 shadow-glowSm'
                : 'border-cardBorder bg-transparent hover:border-white/20 hover:bg-white/5'
              }
              ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label="Didn't try the tip"
          >
            <span className="text-lg mb-1 block">🤷</span>
            <span className="text-sm font-medium text-text0">Didn&apos;t try</span>
          </button>

          <button
            onClick={() => handleSelect('not_relevant')}
            disabled={submitting}
            className={`
              flex-1 px-4 py-3 rounded-lg border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white/30
              ${selected === 'not_relevant'
                ? 'border-white/30 bg-white/10 shadow-glowSm'
                : 'border-cardBorder bg-transparent hover:border-white/20 hover:bg-white/5'
              }
              ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label="Tip was not relevant"
          >
            <span className="text-lg mb-1 block">🚫</span>
            <span className="text-sm font-medium text-text0">Not relevant</span>
          </button>
        </div>

        {onDismiss && !submitting && (
          <div className="flex justify-end">
            <button
              onClick={onDismiss}
              className="text-xs text-text2 hover:text-text1 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2 py-1"
              aria-label="Skip tip feedback"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
