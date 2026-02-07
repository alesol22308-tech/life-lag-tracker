import * as webpush from 'web-push';

/**
 * Web Push notification utility functions for sending notifications to browsers
 * 
 * Uses the Web Push Protocol with VAPID keys for browser push notifications.
 * This is separate from Firebase Cloud Messaging (FCM) which is used for mobile apps.
 * 
 * Environment variables required:
 * - VAPID_PRIVATE_KEY - Private key from VAPID key pair (PEM format)
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY - Public key (already used client-side)
 * 
 * The VAPID keys should be generated using:
 * npx web-push generate-vapid-keys
 */

// VAPID configuration (singleton pattern)
let vapidConfigured = false;

/**
 * Initialize VAPID configuration from environment variables
 */
function configureVAPID() {
  if (vapidConfigured) {
    return;
  }

  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPrivateKey || !vapidPublicKey) {
    console.warn('VAPID keys not configured. Web push notifications will not be sent.');
    console.warn('Required env vars: VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    return;
  }

  try {
    // Set VAPID details for web-push
    webpush.setVapidDetails(
      'mailto:checkin@lifelag.app', // Contact email (required by VAPID spec)
      vapidPublicKey,
      vapidPrivateKey
    );

    vapidConfigured = true;
    console.log('VAPID configuration initialized successfully');
  } catch (error) {
    console.error('Failed to configure VAPID:', error);
  }
}

/**
 * Check if web push notifications are configured
 */
export function isWebPushConfigured(): boolean {
  return !!(
    process.env.VAPID_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

/**
 * Push subscription data format (matches database schema)
 */
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string; // Base64 encoded
    auth: string; // Base64 encoded
  };
}

/**
 * Send web push notification to a subscription
 * 
 * @param subscription - Push subscription object with endpoint and keys
 * @param title - Notification title
 * @param body - Notification body
 * @param options - Optional data payload and other options
 * @returns Promise with success status and optional error message
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  title: string,
  body: string,
  options?: {
    data?: Record<string, string>;
    badge?: string;
    icon?: string;
    image?: string;
    tag?: string;
    requireInteraction?: boolean;
    url?: string;
  }
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  if (!isWebPushConfigured()) {
    console.log(`[Web Push - Not Configured] Would send to ${subscription.endpoint}: ${title} - ${body}`);
    return { success: false, error: 'VAPID keys not configured' };
  }

  configureVAPID();

  if (!vapidConfigured) {
    return { success: false, error: 'VAPID configuration failed' };
  }

  try {
    // Convert subscription to web-push format
    // The web-push library expects keys as base64url strings (same format as browser PushSubscription)
    // Our keys are stored as base64, which is compatible
    const pushSubscription: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    // Prepare notification payload
    // The service worker expects title, body, url, and data at the top level
    const payload = JSON.stringify({
      title,
      body,
      ...(options?.url && { url: options.url }),
      ...(options?.icon && { icon: options.icon }),
      ...(options?.badge && { badge: options.badge }),
      ...(options?.image && { image: options.image }),
      ...(options?.tag && { tag: options.tag }),
      ...(options?.data && { data: options.data }),
      ...(options?.requireInteraction && { requireInteraction: options.requireInteraction }),
    });

    // Send notification
    await webpush.sendNotification(pushSubscription, payload);

    console.log(`[Web Push] Successfully sent to ${subscription.endpoint}: ${title}`);
    return { success: true };
  } catch (error: any) {
    const statusCode = error.statusCode;
    
    // Handle specific error cases
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired (410) or not found (404) - no longer valid
      console.warn(`[Web Push] Subscription expired/not found (${statusCode}): ${subscription.endpoint}`);
      return { success: false, error: 'Subscription expired', statusCode };
    } else if (statusCode === 429) {
      // Rate limited
      console.warn(`[Web Push] Rate limited: ${subscription.endpoint}`);
      return { success: false, error: 'Rate limited', statusCode };
    } else if (statusCode === 400 || statusCode === 413) {
      // Bad request or payload too large
      console.error(`[Web Push] Invalid request: ${subscription.endpoint}`, error.message);
      return { success: false, error: `Invalid request: ${error.message}`, statusCode };
    } else if (statusCode === 401) {
      // Unauthorized - VAPID key issue
      console.error(`[Web Push] Unauthorized (VAPID key issue): ${subscription.endpoint}`);
      return { success: false, error: 'Unauthorized - VAPID key issue', statusCode };
    } else {
      console.error(`[Web Push] Error sending notification to ${subscription.endpoint}:`, error);
      return { success: false, error: error.message || 'Unknown error', statusCode };
    }
  }
}
