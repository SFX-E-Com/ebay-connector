import { describe, it, expect, vi } from 'vitest';
import {
  generateId,
  serializeForFirestore,
  deserializeFromFirestore,
  UserRoles,
  LogLevels,
  Collections,
} from '../firestore';

describe('generateId', () => {
  it('generates a 20 character string', () => {
    const id = generateId();
    expect(id).toHaveLength(20);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('only contains alphanumeric characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe('serializeForFirestore', () => {
  it('passes through primitive values', () => {
    const data = {
      string: 'hello',
      number: 42,
      boolean: true,
      nullValue: null,
    };

    const result = serializeForFirestore(data);

    expect(result).toEqual(data);
  });

  it('handles Date objects', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const data = { createdAt: date };

    const result = serializeForFirestore(data);

    expect(result.createdAt).toEqual(date);
  });

  it('handles nested objects', () => {
    const data = {
      user: {
        name: 'Test',
        createdAt: new Date('2024-01-15'),
      },
    };

    const result = serializeForFirestore(data);

    expect(result.user).toBeDefined();
    expect((result.user as Record<string, unknown>).name).toBe('Test');
  });

  it('handles arrays', () => {
    const date = new Date('2024-01-15');
    const data = {
      dates: [date, new Date('2024-01-16')],
      items: ['a', 'b', 'c'],
    };

    const result = serializeForFirestore(data);

    expect(Array.isArray(result.dates)).toBe(true);
    expect((result.dates as Date[])[0]).toEqual(date);
    expect(result.items).toEqual(['a', 'b', 'c']);
  });
});

describe('deserializeFromFirestore', () => {
  it('passes through primitive values', () => {
    const data = {
      string: 'hello',
      number: 42,
      boolean: true,
    };

    const result = deserializeFromFirestore<typeof data>(data);

    expect(result).toEqual(data);
  });

  it('converts Firestore Timestamps to Date objects', () => {
    const mockDate = new Date('2024-01-15T12:00:00Z');
    const mockTimestamp = {
      toDate: () => mockDate,
    };

    const data = {
      createdAt: mockTimestamp,
    };

    const result = deserializeFromFirestore<{ createdAt: Date }>(data);

    expect(result.createdAt).toEqual(mockDate);
  });

  it('handles arrays with Timestamps', () => {
    const mockDate = new Date('2024-01-15');
    const mockTimestamp = { toDate: () => mockDate };

    const data = {
      dates: [mockTimestamp],
    };

    const result = deserializeFromFirestore<{ dates: Date[] }>(data);

    expect(result.dates[0]).toEqual(mockDate);
  });

  it('handles nested objects with Timestamps', () => {
    const mockDate = new Date('2024-01-15');
    const mockTimestamp = { toDate: () => mockDate };

    const data = {
      user: {
        name: 'Test',
        createdAt: mockTimestamp,
      },
    };

    const result = deserializeFromFirestore<{
      user: { name: string; createdAt: Date };
    }>(data);

    expect(result.user.createdAt).toEqual(mockDate);
  });
});

describe('Constants', () => {
  describe('UserRoles', () => {
    it('has expected roles', () => {
      expect(UserRoles.ADMIN).toBe('ADMIN');
      expect(UserRoles.USER).toBe('USER');
      expect(UserRoles.SUPER_ADMIN).toBe('SUPER_ADMIN');
    });
  });

  describe('LogLevels', () => {
    it('has expected log levels', () => {
      expect(LogLevels.DEBUG).toBe('DEBUG');
      expect(LogLevels.INFO).toBe('INFO');
      expect(LogLevels.WARN).toBe('WARN');
      expect(LogLevels.ERROR).toBe('ERROR');
    });
  });

  describe('Collections', () => {
    it('has expected collection names', () => {
      expect(Collections.USERS).toBe('users');
      expect(Collections.API_TOKENS).toBe('api_tokens');
      expect(Collections.EBAY_ACCOUNTS).toBe('ebay_accounts');
      expect(Collections.DEBUG_LOGS).toBe('debug_logs');
    });
  });
});
