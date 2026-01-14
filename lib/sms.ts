/**
 * SMS utility functions for sending reminders
 * 
 * To use this, you'll need to configure an SMS service provider:
 * - Twilio (recommended): https://www.twilio.com
 * - AWS SNS: https://aws.amazon.com/sns
 * - Vonage/Nexmo: https://www.vonage.com
 * 
 * Environment variables required (example for Twilio):
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_FROM_NUMBER (or SMS_FROM_NUMBER)
 */

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
  // TODO: Implement SMS sending based on your service provider
  // Example for Twilio:
  /*
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.SMS_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER environment variables.');
  }

  const client = require('twilio')(accountSid, authToken);

  await client.messages.create({
    body: message,
    from: fromNumber,
    to: phoneNumber,
  });
  */

  // For now, just log (remove this in production)
  console.log(`[SMS] Would send to ${phoneNumber}: ${message}`);
  
  throw new Error(
    'SMS service not yet configured. Please set up Twilio, AWS SNS, or another SMS provider.'
  );
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
