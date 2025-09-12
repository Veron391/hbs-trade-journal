import { describe, it, expect } from 'vitest';
import { currencyShort, numberShort, pct, dateLabel } from '../format';

describe('format helpers', () => {
  describe('currencyShort', () => {
    it('should format small numbers correctly', () => {
      expect(currencyShort(123.45)).toBe('$123.45');
      expect(currencyShort(-123.45)).toBe('-$123.45');
      expect(currencyShort(0)).toBe('$0.00');
    });

    it('should format thousands correctly', () => {
      expect(currencyShort(1234)).toBe('$1.2K');
      expect(currencyShort(12345)).toBe('$12.3K');
      expect(currencyShort(-1234)).toBe('-$1.2K');
    });

    it('should format millions correctly', () => {
      expect(currencyShort(1234567)).toBe('$1.23M');
      expect(currencyShort(12345678)).toBe('$12.35M');
      expect(currencyShort(-1234567)).toBe('-$1.23M');
    });

    it('should format billions correctly', () => {
      expect(currencyShort(1234567890)).toBe('$1.23B');
      expect(currencyShort(12345678900)).toBe('$12.35B');
      expect(currencyShort(-1234567890)).toBe('-$1.23B');
    });
  });

  describe('numberShort', () => {
    it('should format small numbers correctly', () => {
      expect(numberShort(123)).toBe('123');
      expect(numberShort(-123)).toBe('-123');
      expect(numberShort(0)).toBe('0');
    });

    it('should format thousands correctly', () => {
      expect(numberShort(1234)).toBe('1.2K');
      expect(numberShort(12345)).toBe('12.3K');
      expect(numberShort(-1234)).toBe('-1.2K');
    });

    it('should format millions correctly', () => {
      expect(numberShort(1234567)).toBe('1.2M');
      expect(numberShort(12345678)).toBe('12.3M');
      expect(numberShort(-1234567)).toBe('-1.2M');
    });

    it('should format billions correctly', () => {
      expect(numberShort(1234567890)).toBe('1.2B');
      expect(numberShort(12345678900)).toBe('12.3B');
      expect(numberShort(-1234567890)).toBe('-1.2B');
    });
  });

  describe('pct', () => {
    it('should format percentages correctly', () => {
      expect(pct(45.3)).toBe('45.3%');
      expect(pct(45.345, 2)).toBe('45.35%');
      expect(pct(0)).toBe('0.0%');
      expect(pct(100)).toBe('100.0%');
    });

    it('should handle different decimal places', () => {
      expect(pct(45.345, 0)).toBe('45%');
      expect(pct(45.345, 3)).toBe('45.345%');
    });
  });

  describe('dateLabel', () => {
    it('should format dates correctly', () => {
      expect(dateLabel('2023-01-15')).toBe('Jan 15');
      expect(dateLabel('2023-12-25')).toBe('Dec 25');
      expect(dateLabel('2023-06-01')).toBe('Jun 1');
    });

    it('should handle different locales', () => {
      // Note: This test might be locale-dependent
      expect(dateLabel('2023-01-15', 'en-US')).toBe('Jan 15');
    });
  });
});
