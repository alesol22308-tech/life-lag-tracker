'use client';

import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';

interface PushNotificationPromptProps {
  /** Optional className for additional styling */
  className?: string;
  /** Whether to show as a card or inline */
  variant?: 'card' | 'inline';
}

/**
 * Component for managing push notification subscriptions.
 * 
 * Shows different states:
 * - "Enable Notifications" button if not subscribed
 * - "Disable Notifications" button if subscribed
 * - Loading state during subscription
 * - Error messages if permission denied or subscription fails
 * - "Not supported" message if browser doesn't support push
 */
export default function PushNotificationPrompt({ 
  className = '',
  variant = 'card'
}: PushNotificationPromptProps) {
  const {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    loading,
    error,
    permission,
  } = usePushNotifications();

  // Browser doesn't support push notifications
  if (!isSupported) {
    const content = (
      <div className="flex items-center gap-3 text-text1">
        <svg 
          className="w-5 h-5 text-text2 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
          />
        </svg>
        <span className="text-sm">
          Push notifications are not supported in this browser.
        </span>
      </div>
    );

    if (variant === 'inline') {
      return <div className={className}>{content}</div>;
    }

    return (
      <GlassCard className={className} hover={false} padding="sm">
        {content}
      </GlassCard>
    );
  }

  // Permission was denied
  if (permission === 'denied') {
    const content = (
      <div className="flex items-center gap-3 text-amber-400">
        <svg 
          className="w-5 h-5 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <span className="text-sm">
          Notification permission was denied. Please enable notifications in your browser settings.
        </span>
      </div>
    );

    if (variant === 'inline') {
      return <div className={className}>{content}</div>;
    }

    return (
      <GlassCard className={className} hover={false} padding="sm">
        {content}
      </GlassCard>
    );
  }

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const content = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <svg 
            className={`w-5 h-5 flex-shrink-0 ${isSubscribed ? 'text-green-400' : 'text-text2'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-text0">
              {isSubscribed ? 'Notifications enabled' : 'Push Notifications'}
            </p>
            <p className="text-xs text-text2">
              {isSubscribed 
                ? 'You will receive reminders for check-ins' 
                : 'Get reminded to complete your weekly check-ins'}
            </p>
          </div>
        </div>
        
        <PrimaryButton
          onClick={handleClick}
          disabled={loading}
          className={`text-sm whitespace-nowrap ${
            isSubscribed 
              ? 'border-red-500/30 hover:border-red-500/50 text-red-400' 
              : 'border-green-500/30 hover:border-green-500/50 text-green-400'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg 
                className="animate-spin h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isSubscribed ? 'Disabling...' : 'Enabling...'}
            </span>
          ) : isSubscribed ? (
            'Disable'
          ) : (
            'Enable'
          )}
        </PrimaryButton>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
          <svg 
            className="w-4 h-4 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return <div className={className}>{content}</div>;
  }

  return (
    <GlassCard className={className} hover={false} padding="md">
      {content}
    </GlassCard>
  );
}
