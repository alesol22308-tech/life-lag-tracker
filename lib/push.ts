import * as admin from 'firebase-admin';

/**
 * Push notification utility functions for sending notifications
 * 
 * Uses Firebase Cloud Messaging (FCM) for both Android and iOS push notifications.
 * 
 * Environment variables required:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (base64 encoded to preserve newlines)
 * 
 * For Firebase setup instructions, see MOBILE_INTEGRATION_SETUP.md
 */

// Initialize Firebase Admin SDK (singleton pattern)
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized || admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyBase64) {
    console.warn('Firebase credentials not configured. Push notifications will not be sent.');
    console.warn('Required env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    return;
  }

  try {
    // Decode base64 private key (needed because newlines get mangled in env vars)
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Send push notification to a device token
 * 
 * @param deviceToken - Device token (FCM token for both Android and iOS)
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional data payload
 * @returns Promise that resolves when notification is sent
 */
export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  if (!isPushConfigured()) {
    console.log(`[Push - Not Configured] Would send to ${deviceToken}: ${title} - ${body}`);
    return; // Silently skip if not configured
  }

  initializeFirebase();

  if (!firebaseInitialized) {
    console.error('Firebase not initialized, cannot send push notification');
    return;
  }

  try {
    const message: admin.messaging.Message = {
      token: deviceToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      // Platform-specific options
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    await admin.messaging().send(message);
    console.log(`[Push] Successfully sent to ${deviceToken}: ${title}`);
  } catch (error: any) {
    // Handle specific error cases
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.warn(`[Push] Invalid/expired token: ${deviceToken}. Should be removed from DB.`);
      // In production, you might want to remove this token from the database
    } else {
      console.error('[Push] Error sending notification:', error);
    }
    throw error;
  }
}

/**
 * Send weekly reminder push notification
 */
export async function sendWeeklyReminderPush(deviceToken: string): Promise<void> {
  const title = 'Time for your weekly check-in';
  const body = "It's been a week since your last check-in. Take 3 minutes to see where things stand.";
  const data = {
    type: 'weekly_reminder',
    url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/checkin`,
  };
  
  await sendPushNotification(deviceToken, title, body, data);
}

/**
 * Send mid-week check push notification
 */
export async function sendMidWeekCheckPush(deviceToken: string): Promise<void> {
  const title = "How's your week feeling?";
  const body = 'Take a quick mid-week check to see where things stand.';
  const data = {
    type: 'mid_week_check',
    url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/home`,
  };
  
  await sendPushNotification(deviceToken, title, body, data);
}
