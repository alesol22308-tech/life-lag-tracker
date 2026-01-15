import twilio from 'twilio';

/**
 * SMS utility functions for sending reminders
 * 
 * Uses Twilio for SMS delivery.
 * 
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_FROM_NUMBER
 * 
 * For Twilio setup instructions, see MOBILE_INTEGRATION_SETUP.md
 */

let twilioClient: twilio.Twilio | null = null;

/**
 * Initialize Twilio client (singleton pattern)
 */
function getTwilioClient(): twilio.Twilio | null {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not configured. SMS will not be sent.');
    console.warn('Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
    return null;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
    return twilioClient;
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    return null;
  }
}

/**
 * Check if SMS is configured
 */
export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

/**
 * Send reminder SMS to a phone number
 * 
 * @param phoneNumber - Recipient phone number (E.164 format recommended)
 * @param message - Message to send
 * @returns Promise that resolves when SMS is sent
 */
export async function sendReminderSMS(
  phoneNumber: string,
  message: string
): Promise<void> {
  if (!isSmsConfigured()) {
    console.log(`[SMS - Not Configured] Would send to ${phoneNumber}: ${message}`);
    return; // Silently skip if not configured
  }

  const client = getTwilioClient();
  if (!client) {
    console.error('Twilio client not initialized, cannot send SMS');
    return;
  }

  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!fromNumber) {
    console.error('TWILIO_FROM_NUMBER not configured');
    return;
  }

  try {
    // Format phone number to E.164 if needed
    const formattedPhone = formatPhoneNumber(phoneNumber);

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log(`[SMS] Successfully sent to ${formattedPhone}`);
  } catch (error: any) {
    console.error('[SMS] Error sending message:', error);
    // Log specific Twilio error codes
    if (error.code) {
      console.error(`[SMS] Twilio error code: ${error.code}`);
    }
    throw error;
  }
}

/**
 * Format phone number to E.164 format (optional helper)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    return `+1${cleaned}`;
  }
  
  return cleaned;
}
