'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Subscription object shape expected by the API
 */
export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Return type for the usePushNotifications hook
 */
export interface UsePushNotificationsResult {
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Current notification permission status */
  permission: NotificationPermission | null;
  /** Current push subscription (if any) */
  subscription: PushSubscription | null;
  /** Whether user is currently subscribed */
  isSubscribed: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Error message if any operation failed */
  error: string | null;
  /** Whether an operation is in progress */
  loading: boolean;
}

/**
 * Convert a base64 string to a Uint8Array for use with PushManager
 * Handles URL-safe base64 encoding
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert PushSubscription to the JSON format expected by the API
 */
function subscriptionToJSON(subscription: PushSubscription): PushSubscriptionJSON | null {
  const p256dhKey = subscription.getKey('p256dh');
  const authKey = subscription.getKey('auth');

  if (!p256dhKey || !authKey) {
    return null;
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(p256dhKey),
      auth: arrayBufferToBase64(authKey),
    },
  };
}

/**
 * Hook to manage web push notifications
 * 
 * Features:
 * - Checks browser support for push notifications
 * - Requests notification permission
 * - Subscribes user to push notifications using VAPID key
 * - Sends subscription to backend API
 * - Includes unsubscribe functionality
 * - Returns subscription status
 * 
 * @example
 * ```tsx
 * const { isSupported, isSubscribed, subscribe, unsubscribe, loading, error } = usePushNotifications();
 * 
 * if (!isSupported) return <p>Push notifications not supported</p>;
 * 
 * return (
 *   <button onClick={isSubscribed ? unsubscribe : subscribe} disabled={loading}>
 *     {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
 *   </button>
 * );
 * ```
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check browser support and get existing subscription on mount
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) {
      return;
    }

    // Get current permission status
    setPermission(Notification.permission);

    // Get existing subscription if any
    const getExistingSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      } catch (err) {
        console.error('Error getting existing subscription:', err);
      }
    };

    getExistingSubscription();
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setError('VAPID public key is not configured');
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable is not set');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setError('Notification permission denied');
        setLoading(false);
        return false;
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription first
      let pushSubscription = await registration.pushManager.getSubscription();

      // If no existing subscription, create one
      if (!pushSubscription) {
        try {
          console.log('VAPID key length:', vapidPublicKey.length);
          console.log('VAPID key first 10 chars:', vapidPublicKey.substring(0, 10));
          const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
          console.log('Converted key length:', applicationServerKey.length);
          
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        } catch (subscribeError: any) {
          console.error('PushManager.subscribe error:', subscribeError);
          console.error('Error name:', subscribeError.name);
          console.error('Error message:', subscribeError.message);
          throw new Error(`Registration failed - ${subscribeError.message || subscribeError.name || 'push service error'}`);
        }
      }

      setSubscription(pushSubscription);

      // Convert subscription to JSON format
      const subscriptionJSON = subscriptionToJSON(pushSubscription);
      if (!subscriptionJSON) {
        throw new Error('Failed to extract subscription keys');
      }

      // Send subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionJSON),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save subscription to server');
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error subscribing to push notifications:', err);
      setError(err.message || 'Failed to subscribe to push notifications');
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) {
      setError('No active subscription to unsubscribe from');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Get subscription JSON before unsubscribing (we need the endpoint)
      const subscriptionJSON = subscriptionToJSON(subscription);

      // Unsubscribe from PushManager
      const success = await subscription.unsubscribe();
      
      if (!success) {
        throw new Error('Failed to unsubscribe from push notifications');
      }

      setSubscription(null);

      // Remove subscription from backend
      if (subscriptionJSON) {
        const response = await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscriptionJSON.endpoint }),
        });

        if (!response.ok) {
          // Log error but don't fail - local unsubscribe succeeded
          console.error('Failed to remove subscription from server');
        }
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err.message || 'Failed to unsubscribe from push notifications');
      setLoading(false);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: subscription !== null,
    subscribe,
    unsubscribe,
    error,
    loading,
  };
}
