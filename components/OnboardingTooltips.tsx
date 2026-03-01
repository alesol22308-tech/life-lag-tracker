'use client';

import { useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useTheme } from '@/lib/hooks/useTheme';

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
  const { resolvedTheme } = useTheme();
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');

  const steps: Step[] = [
    {
      target: '[data-onboarding="welcome"]',
      content: t('step1Body'),
      placement: 'center',
      disableBeacon: true,
      title: t('step1Title'),
    },
    {
      target: '[data-onboarding="question-scale"]',
      content: t('step2Body'),
      placement: 'bottom',
      disableBeacon: true,
      title: t('step2Title'),
    },
    {
      target: '[data-onboarding="progress-indicator"]',
      content: t('step2Body'),
      placement: 'bottom',
      title: t('step2Title'),
    },
    {
      target: '[data-onboarding="reflection-notes"]',
      content: t('step3Body'),
      placement: 'top',
      title: t('step3Title'),
    },
    {
      target: '[data-onboarding="submit-button"]',
      content: t('step4Body'),
      placement: 'top',
      title: t('step4Title'),
    },
  ];

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

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

  // Theme-aware styles for Joyride tooltips
  const joyrideStylesDark = {
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
    tooltipTitle: {
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '8px',
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

  const joyrideStylesLight = {
    options: {
      primaryColor: 'rgba(0, 0, 0, 0.1)',
      textColor: '#000000',
      overlayColor: 'rgba(255, 255, 255, 0.85)',
      arrowColor: 'rgba(0, 0, 0, 0.2)',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      spotlightShadow: '0 0 20px rgba(0, 0, 0, 0.15)',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: '12px',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipTitle: {
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '8px',
    },
    buttonNext: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      color: '#000000',
      borderRadius: '8px',
      padding: '8px 16px',
      border: '1px solid rgba(0, 0, 0, 0.2)',
      fontSize: '14px',
    },
    buttonBack: {
      color: 'rgba(0, 0, 0, 0.6)',
      fontSize: '14px',
      marginRight: '8px',
    },
    buttonSkip: {
      color: 'rgba(0, 0, 0, 0.5)',
      fontSize: '14px',
    },
    spotlight: {
      borderRadius: '12px',
    },
  };

  const joyrideStyles = resolvedTheme === 'dark' ? joyrideStylesDark : joyrideStylesLight;

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
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: tCommon('back'),
        close: tCommon('close'),
        last: t('finish'),
        next: tCommon('next'),
        skip: t('skipTour'),
      }}
      floaterProps={{
        disableAnimation: prefersReducedMotion,
      }}
      disableOverlayClose={false}
      hideCloseButton={false}
    />
  );
}
