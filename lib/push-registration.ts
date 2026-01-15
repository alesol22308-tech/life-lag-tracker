/**
 * Client-side push notification registration utility
 * 
 * This module handles registering for push notifications on mobile devices
 * using Capacitor's Push Notifications plugin.
 * 
 * For web/browser environments, this will gracefully handle the lack of support.
 */

export interface PushRegistrationResult {
  success: boolean;
  token?: string;
  error?: string;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Lazy load Capacitor modules (only on native platforms)
 */
async function getCapacitorModules() {
  try {
    const [{ Capacitor }, { PushNotifications }] = await Promise.all([
      import('@capacitor/core'),
      import('@capacitor/push-notifications'),
    ]);
    return { Capacitor, PushNotifications };
  } catch (error) {
    // Capacitor not available (web build)
    return null;
  }
}

/**
 * Check if push notifications are available on this platform
 */
export function isPushAvailable(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }
  
  // For web builds, Capacitor won't be available
  // We'll return false here and handle it gracefully
  return false;
}

/**
 * Get the current platform
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return 'web';
}

/**
 * Register for push notifications
 * 
 * This will:
 * 1. Check for permission
 * 2. Request permission if needed
 * 3. Register for push notifications
 * 4. Return the device token
 * 
 * @returns Promise with registration result
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  const modules = await getCapacitorModules();
  
  if (!modules) {
    return {
      success: false,
      error: 'Push notifications are only available on mobile devices',
      platform: 'web',
    };
  }

  const { Capacitor, PushNotifications } = modules;
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  // Check if running on a native platform
  if (!Capacitor.isNativePlatform()) {
    return {
      success: false,
      error: 'Push notifications are only available on mobile devices',
      platform,
    };
  }

  try {
    // Check current permission status
    let permStatus = await PushNotifications.checkPermissions();

    // If permission is not granted, request it
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    // If permission denied, return error
    if (permStatus.receive !== 'granted') {
      return {
        success: false,
        error: 'Push notification permission denied',
        platform,
      };
    }

    // Register for push notifications
    await PushNotifications.register();

    // Wait for registration to complete and return token
    // Note: The actual token is received via the 'registration' event
    // which should be set up in the app initialization
    return {
      success: true,
      platform,
    };
  } catch (error: any) {
    console.error('Error registering for push notifications:', error);
    return {
      success: false,
      error: error.message || 'Failed to register for push notifications',
      platform,
    };
  }
}

/**
 * Unregister from push notifications
 */
export async function unregisterFromPushNotifications(): Promise<void> {
  const modules = await getCapacitorModules();
  
  if (!modules) {
    return;
  }

  const { Capacitor, PushNotifications } = modules;
  
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await PushNotifications.unregister();
    console.log('Successfully unregistered from push notifications');
  } catch (error) {
    console.error('Error unregistering from push notifications:', error);
    throw error;
  }
}

/**
 * Setup push notification listeners
 * 
 * This should be called once when the app initializes to set up
 * listeners for push notification events.
 * 
 * @param onTokenReceived - Callback when device token is received
 * @param onNotificationReceived - Callback when notification is received (optional)
 */
export async function setupPushNotificationListeners(
  onTokenReceived: (token: string) => void,
  onNotificationReceived?: (notification: any) => void
): Promise<void> {
  const modules = await getCapacitorModules();
  
  if (!modules) {
    console.log('Push notifications not available on this platform');
    return;
  }

  const { Capacitor, PushNotifications } = modules;
  
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications not available on this platform');
    return;
  }

  // Called when registration is successful and token is received
  await PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token:', token.value);
    onTokenReceived(token.value);
  });

  // Called when registration fails
  await PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // Called when a notification is received while app is in foreground
  if (onNotificationReceived) {
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      onNotificationReceived(notification);
    });
  }

  // Called when user taps on a notification
  await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed:', notification);
    // You can handle navigation here based on notification data
    const data = notification.notification.data;
    if (data?.url) {
      // Navigate to the URL specified in the notification
      window.location.href = data.url;
    }
  });
}

/**
 * Save device token to backend
 * 
 * @param token - Device token received from push registration
 * @param platform - Platform (ios, android, web)
 */
export async function saveDeviceToken(
  token: string,
  platform: 'ios' | 'android' | 'web'
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/push/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceToken: token,
        platform,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to save device token:', error);
      return false;
    }

    console.log('Device token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving device token:', error);
    return false;
  }
}

/**
 * Remove device token from backend
 * 
 * @param token - Device token to remove (optional - if not provided, all tokens for user are removed)
 */
export async function removeDeviceToken(token?: string): Promise<boolean> {
  try {
    const url = token
      ? `/api/notifications/push/register?token=${encodeURIComponent(token)}`
      : '/api/notifications/push/register';

    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to remove device token:', error);
      return false;
    }

    console.log('Device token removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing device token:', error);
    return false;
  }
}
