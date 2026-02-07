/**
 * ICS (iCalendar) file generation utilities
 * Supports Google Calendar and Apple Calendar
 *
 * Uses floating local time for DTSTART/DTEND so imported events show at the
 * user's preferred check-in time in their calendar's timezone.
 */

/**
 * Format date to ICS format with Z (UTC) - for DTSTAMP
 */
function formatICSDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Format date/time as floating local time (no Z, no TZID).
 * Calendar apps interpret this as the user's local time when importing.
 */
function formatICSDateFloating(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds = 0
): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const h = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  return `${year}${m}${d}T${h}${min}${s}`;
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
 * Day name to JS getDay() (0 = Sunday, 1 = Monday, ...)
 */
function dayNameToGetDay(day: string): number {
  const map: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };
  return map[day] ?? 1;
}

/**
 * Get the next occurrence of the preferred weekday at the given time.
 * Returns calendar date and time for use as floating DTSTART so the event
 * appears on the correct day at the correct local time when imported.
 */
function getNextOccurrence(
  preferredDay: string,
  hours: number,
  minutes: number
): { year: number; month: number; day: number } {
  const targetDow = dayNameToGetDay(preferredDay);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();
  let d = new Date(Date.UTC(year, month, date, 12, 0, 0, 0));
  let currentDow = d.getUTCDay();
  let diff = targetDow - currentDow;
  if (diff < 0) diff += 7;
  if (diff === 0) {
    const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    const targetMins = hours * 60 + (minutes || 0);
    if (nowMins >= targetMins) diff = 7;
  }
  d.setUTCDate(d.getUTCDate() + diff);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/**
 * Generate ICS file content for recurring check-in reminders.
 * Uses floating local time so when the user imports the file, events appear
 * at their preferred check-in day and time in their calendar's timezone.
 */
export function generateCheckinReminderICS(
  preferredDay: string,
  preferredTime: string,
  _startDate?: Date
): string {
  const now = new Date();

  // Parse time (HH:MM format) - this is the user's preferred local time
  const [hours, minutes] = preferredTime.split(':').map(Number);
  const mins = minutes ?? 0;

  // First occurrence: next preferred weekday at preferred time (floating local time)
  const first = getNextOccurrence(preferredDay, hours, mins);

  const startStr = formatICSDateFloating(first.year, first.month, first.day, hours, mins, 0);
  let endHours = mins + 15 >= 60 ? hours + 1 : hours;
  const endMins = mins + 15 >= 60 ? (mins + 15) % 60 : mins + 15;
  let endYear = first.year;
  let endMonth = first.month;
  let endDay = first.day;
  if (endHours >= 24) {
    endHours -= 24;
    const endDate = new Date(Date.UTC(first.year, first.month - 1, first.day + 1));
    endYear = endDate.getUTCFullYear();
    endMonth = endDate.getUTCMonth() + 1;
    endDay = endDate.getUTCDate();
  }
  const endStr = formatICSDateFloating(endYear, endMonth, endDay, endHours, endMins, 0);

  const uid = `lifelag-checkin-${Date.now()}@lifelag.app`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Life-Lag//Check-in Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `DTSTAMP:${formatICSDateUTC(now)}`,
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
