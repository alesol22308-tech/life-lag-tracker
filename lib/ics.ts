/**
 * ICS (iCalendar) file generation utilities
 * Supports Google Calendar and Apple Calendar
 */

/**
 * Format date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Convert day name to RRULE day abbreviation
 */
function dayToRRULE(day: string): string {
  const dayMap: Record<string, string> = {
    'Monday': 'MO',
    'Tuesday': 'TU',
    'Wednesday': 'WE',
    'Thursday': 'TH',
    'Friday': 'FR',
    'Saturday': 'SA',
    'Sunday': 'SU',
  };
  return dayMap[day] || 'MO';
}

/**
 * Generate ICS file content for recurring check-in reminders
 */
export function generateCheckinReminderICS(
  preferredDay: string,
  preferredTime: string,
  startDate?: Date
): string {
  const now = new Date();
  const start = startDate || now;
  
  // Parse time (HH:MM format)
  const [hours, minutes] = preferredTime.split(':').map(Number);
  
  // Create start datetime
  const eventStart = new Date(start);
  eventStart.setUTCHours(hours, minutes || 0, 0, 0);
  
  // Create end datetime (15 minutes later)
  const eventEnd = new Date(eventStart);
  eventEnd.setUTCMinutes(eventEnd.getUTCMinutes() + 15);
  
  // Generate unique ID
  const uid = `lifelag-checkin-${Date.now()}@lifelag.app`;
  
  // Generate ICS content
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Life-Lag//Check-in Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatICSDate(eventStart)}`,
    `DTEND:${formatICSDate(eventEnd)}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `SUMMARY:Life-Lag Weekly Check-In`,
    `DESCRIPTION:Weekly check-in to track your life drift and maintain awareness of your energy, sleep, structure, and engagement.\\n\\nComplete your check-in at: https://lifelag.app/checkin`,
    `LOCATION:Life-Lag App`,
    `RRULE:FREQ=WEEKLY;BYDAY=${dayToRRULE(preferredDay)};INTERVAL=1`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Weekly check-in reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  
  return icsLines.join('\r\n');
}

/**
 * Generate filename for ICS file
 */
export function generateICSFilename(): string {
  return `lifelag-checkin-reminders.ics`;
}
