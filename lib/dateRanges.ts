/**
 * Date range utility functions for dashboard filtering
 * All times are in UTC+5 (Tashkent timezone)
 */

/**
 * Configure timezone to UTC+5 (Tashkent time)
 */
export function getTashkentTime(): Date {
  const now = new Date();
  // Convert to UTC+5 (Tashkent time)
  const tashkentTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
  return tashkentTime;
}

/**
 * Get date range for this month (from start of current month to now)
 */
export function thisMonth(now = getTashkentTime()): { start: Date; end: Date } {
  const currentDate = new Date(now);
  
  // Get first day of current month
  const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  firstDayCurrentMonth.setHours(0, 0, 0, 0);
  
  // Current date
  const endDate = new Date(currentDate);
  endDate.setHours(23, 59, 59, 999);
  
  return { start: firstDayCurrentMonth, end: endDate };
}

/**
 * Get date range for 1 week (last 7 days)
 */
export function oneWeek(now = getTashkentTime()): { start: Date; end: Date } {
  const currentDate = new Date(now);
  
  // 7 days ago
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);
  
  // Current date
  const endDate = new Date(currentDate);
  endDate.setHours(23, 59, 59, 999);
  
  return { start: startDate, end: endDate };
}

/**
 * Get date range for last month (complete previous month)
 */
export function lastMonth(now = getTashkentTime()): { start: Date; end: Date } {
  const currentDate = new Date(now);
  
  // Get first day of current month
  const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Get last day of previous month
  const lastDayPreviousMonth = new Date(firstDayCurrentMonth);
  lastDayPreviousMonth.setDate(0); // Day 0 = last day of previous month
  lastDayPreviousMonth.setHours(23, 59, 59, 999);
  
  // Get first day of previous month
  const firstDayPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  firstDayPreviousMonth.setHours(0, 0, 0, 0);
  
  return { start: firstDayPreviousMonth, end: lastDayPreviousMonth };
}

/**
 * Get date range for last 90 days
 */
export function last90Days(now = getTashkentTime()): { start: Date; end: Date } {
  const currentDate = new Date(now);
  
  // 90 days ago
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 90);
  startDate.setHours(0, 0, 0, 0);
  
  // Current date
  const endDate = new Date(currentDate);
  endDate.setHours(23, 59, 59, 999);
  
  return { start: startDate, end: endDate };
}

/**
 * Get date range for year to date (from start of current year to now)
 */
export function yearToDate(now = getTashkentTime()): { start: Date; end: Date } {
  const currentDate = new Date(now);
  
  // Get first day of current year
  const firstDayCurrentYear = new Date(currentDate.getFullYear(), 0, 1);
  firstDayCurrentYear.setHours(0, 0, 0, 0);
  
  // Current date
  const endDate = new Date(currentDate);
  endDate.setHours(23, 59, 59, 999);
  
  return { start: firstDayCurrentYear, end: endDate };
}

/**
 * Get date range for all stats (last 2 years)
 */
export function allStats(now = getTashkentTime()): { start: Date; end: Date } {
  const currentDate = new Date(now);
  
  // 2 years ago
  const startDate = new Date(currentDate);
  startDate.setFullYear(currentDate.getFullYear() - 2);
  startDate.setHours(0, 0, 0, 0);
  
  // Current date
  const endDate = new Date(currentDate);
  endDate.setHours(23, 59, 59, 999);
  
  return { start: startDate, end: endDate };
}

/**
 * Legacy function for backward compatibility
 */
export function weekly(now = getTashkentTime()): { start: Date; end: Date } {
  return oneWeek(now);
}
