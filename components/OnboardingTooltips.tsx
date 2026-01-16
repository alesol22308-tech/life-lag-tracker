'use client';

import { useEffect, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface OnboardingTooltipsProps {
  run: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function OnboardingTooltips({ 
  run, 
  onComplete,
  onSkip 
}: OnboardingTooltipsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: '[data-onboarding="question-scale"]',
      content: 'Select a value from 1 to 5 based on how you\'re feeling. Use the scale: 1 = Very off, 5 = Fully aligned.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-onboarding="progress-indicator"]',
      content: 'This shows your progress through the 6 questions. Each question takes just a moment to answer.',
      placement: 'bottom',
    },
    {
      target: '[data-onboarding="reflection-notes"]',
      content: 'Optional: Add any thoughts or reflections about your week. This helps you track patterns over time.',
      placement: 'top',
    },
    {
      target: '[data-onboarding="submit-button"]',
      content: 'Once you\'ve answered all 6 questions, click here to see your Lag Score and personalized tip.',
      placement: 'top',
    },
  ];

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Mark tooltips as completed
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('checkinTooltipsCompleted', 'true');
      }

      if (status === STATUS.FINISHED && onComplete) {
        onComplete();
      } else if (status === STATUS.SKIPPED && onSkip) {
        onSkip();
      }
    }
  }, [onComplete, onSkip]);

  // Custom styles for tooltips that match the app design
  const joyrideStyles = {
    options: {
      primaryColor: 'rgba(255, 255, 255, 0.2)',
      textColor: '#ffffff',
      overlayColor: 'rgba(5, 5, 5, 0.85)',
      arrowColor: 'rgba(255, 255, 255, 0.2)',
      backgroundColor: 'rgba(20, 20, 20, 0.95)',
      spotlightShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    buttonNext: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '8px 16px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      fontSize: '14px',
    },
    buttonBack: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
      marginRight: '8px',
    },
    buttonSkip: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '14px',
    },
    spotlight: {
      borderRadius: '12px',
    },
  };

  if (!run) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
      floaterProps={{
        disableAnimation: prefersReducedMotion,
      }}
      disableOverlayClose={false}
      hideCloseButton={false}
    />
  );
}
