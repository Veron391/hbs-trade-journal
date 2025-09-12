import { describe, it, expect } from 'vitest';
import { 
  weekly, 
  lastMonth, 
  last90Days, 
  thisMonth, 
  yearToDate, 
  allStats 
} from '../dateRanges';

describe('dateRanges', () => {
  describe('weekly', () => {
    it('should return Monday to Sunday range', () => {
      const result = weekly();
      
      // Check that start is Monday (day 1)
      expect(result.start.getDay()).toBe(1);
      
      // Check that end is Sunday (day 0)
      expect(result.end.getDay()).toBe(0);
      
      // Check that end is after start
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    });
  });

  describe('lastMonth', () => {
    it('should return previous calendar month', () => {
      const result = lastMonth();
      const now = new Date();
      
      // Check that the month is the previous month
      const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      expect(result.start.getMonth()).toBe(expectedMonth);
      
      // Check that end is after start
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
      
      // Check that it's a full month (start is 1st, end is last day)
      expect(result.start.getDate()).toBe(1);
      
      // End should be the last day of the month
      const lastDay = new Date(result.end.getFullYear(), result.end.getMonth() + 1, 0).getDate();
      expect(result.end.getDate()).toBe(lastDay);
    });
  });

  describe('last90Days', () => {
    it('should return 90 days range ending today', () => {
      const result = last90Days();
      const now = new Date();
      
      // Check that end is today (within 1 day tolerance)
      const timeDiff = Math.abs(result.end.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // Less than 1 day
      
      // Check that start is before end
      expect(result.start.getTime()).toBeLessThan(result.end.getTime());
      
      // Check that the range is approximately 90 days
      const dayDiff = Math.floor((result.end.getTime() - result.start.getTime()) / (24 * 60 * 60 * 1000));
      expect(dayDiff).toBe(89); // 90 days inclusive = 89 day difference
    });
  });

  describe('thisMonth', () => {
    it('should return current month from 1st to today', () => {
      const result = thisMonth();
      const now = new Date();
      
      // Check that start is 1st of current month
      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(now.getMonth());
      expect(result.start.getFullYear()).toBe(now.getFullYear());
      
      // Check that end is today or before
      expect(result.end.getTime()).toBeLessThanOrEqual(now.getTime());
      
      // Check that end is after start
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    });
  });

  describe('yearToDate', () => {
    it('should return from January 1st to today', () => {
      const result = yearToDate();
      const now = new Date();
      
      // Check that start is January 1st of current year
      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(0); // January
      expect(result.start.getFullYear()).toBe(now.getFullYear());
      
      // Check that end is today or before
      expect(result.end.getTime()).toBeLessThanOrEqual(now.getTime());
      
      // Check that end is after start
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    });
  });

  describe('allStats', () => {
    it('should return a long historical range', () => {
      const result = allStats();
      const now = new Date();
      
      // Check that start is well in the past (at least 1 year ago)
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      expect(result.start.getTime()).toBeLessThan(oneYearAgo.getTime());
      
      // Check that end is today or before
      expect(result.end.getTime()).toBeLessThanOrEqual(now.getTime());
      
      // Check that end is after start
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    });
  });
});
