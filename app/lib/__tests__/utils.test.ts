import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDateToLocal, generateYAxis, generatePagination } from '../utils';

describe('formatCurrency', () => {
  it('formats cents to USD currency', () => {
    expect(formatCurrency(1000)).toBe('$10.00');
    expect(formatCurrency(9999)).toBe('$99.99');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles large amounts', () => {
    expect(formatCurrency(100000)).toBe('$1,000.00');
    expect(formatCurrency(1000000)).toBe('$10,000.00');
  });
});

describe('formatDateToLocal', () => {
  it('formats date string to local format', () => {
    const result = formatDateToLocal('2024-01-15');
    expect(result).toBe('Jan 15, 2024');
  });

  it('uses custom locale', () => {
    const result = formatDateToLocal('2024-01-15', 'de-DE');
    expect(result).toBe('15. Jan. 2024');
  });
});

describe('generateYAxis', () => {
  it('generates y-axis labels for revenue data', () => {
    const revenue = [
      { month: 'Jan', revenue: 2500 },
      { month: 'Feb', revenue: 3200 },
      { month: 'Mar', revenue: 1800 },
    ];

    const { yAxisLabels, topLabel } = generateYAxis(revenue);

    expect(topLabel).toBe(4000);
    expect(yAxisLabels).toEqual(['$4K', '$3K', '$2K', '$1K', '$0K']);
  });

  it('handles zero revenue', () => {
    const revenue = [{ month: 'Jan', revenue: 0 }];
    const { yAxisLabels, topLabel } = generateYAxis(revenue);

    expect(topLabel).toBe(0);
    expect(yAxisLabels).toEqual(['$0K']);
  });
});

describe('generatePagination', () => {
  it('returns all pages when total is 7 or less', () => {
    expect(generatePagination(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(generatePagination(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows ellipsis at end when on first 3 pages', () => {
    expect(generatePagination(1, 10)).toEqual([1, 2, 3, '...', 9, 10]);
    expect(generatePagination(2, 10)).toEqual([1, 2, 3, '...', 9, 10]);
    expect(generatePagination(3, 10)).toEqual([1, 2, 3, '...', 9, 10]);
  });

  it('shows ellipsis at start when on last 3 pages', () => {
    expect(generatePagination(8, 10)).toEqual([1, 2, '...', 8, 9, 10]);
    expect(generatePagination(9, 10)).toEqual([1, 2, '...', 8, 9, 10]);
    expect(generatePagination(10, 10)).toEqual([1, 2, '...', 8, 9, 10]);
  });

  it('shows ellipsis on both sides when in middle', () => {
    expect(generatePagination(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
    expect(generatePagination(6, 12)).toEqual([1, '...', 5, 6, 7, '...', 12]);
  });
});
