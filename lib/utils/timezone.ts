/**
 * Safe timezone day boundary helpers for filter "Today" / "Upcoming"
 */

export interface DayBoundary {
  startOfDay: Date;
  endOfDay: Date;
}

/**
 * Returns UTC Date objects for start and end of day based on client local time
 */
export function getLocalDayBoundaries(clientDateString?: string): DayBoundary {
  const baseDate = clientDateString ? new Date(clientDateString) : new Date();
  
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

/**
 * Checks if a given date is today in client local time
 */
export function isDateToday(targetDate: Date | string | null | undefined, clientToday: Date = new Date()): boolean {
  if (!targetDate) return false;
  const d = new Date(targetDate);
  return (
    d.getFullYear() === clientToday.getFullYear() &&
    d.getMonth() === clientToday.getMonth() &&
    d.getDate() === clientToday.getDate()
  );
}

/**
 * Checks if a given date is overdue (before today)
 */
export function isDateOverdue(targetDate: Date | string | null | undefined, clientToday: Date = new Date()): boolean {
  if (!targetDate) return false;
  const d = new Date(targetDate);
  const startOfToday = new Date(clientToday);
  startOfToday.setHours(0, 0, 0, 0);
  return d < startOfToday;
}
