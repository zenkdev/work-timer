import { ACTION } from '../types';
import { getTimeIntervals, getTotalSeconds, secondsToString } from '../lib';

describe('secondsToString', () => {
  test('should be "1 second"', () => {
    expect(secondsToString(1)).toBe('1 second');
  });

  test('should be "1 minute 45 seconds"', () => {
    expect(secondsToString(105)).toBe('1 minute 45 seconds');
  });

  test('should be "1 hour 1 minute 1 second"', () => {
    expect(secondsToString(3661)).toBe('1 hour 1 minute 1 second');
  });
});

describe('getTimeIntervals', () => {
  test('should be empty', () => {
    expect(getTimeIntervals([])).toBe('');
  });

  test('should be "10:30-12:30"', () => {
    expect(
      getTimeIntervals([
        { action: ACTION.LOGIN, time: new Date(2025, 3, 1, 10, 30) },
        { action: ACTION.LOGOUT, time: new Date(2025, 3, 1, 12, 30) },
      ]),
    ).toBe('10:30-12:30');
  });

  test('should be "10:30-12:30, 13:30-"', () => {
    expect(
      getTimeIntervals([
        { action: ACTION.LOGIN, time: new Date(2025, 3, 1, 10, 30) },
        { action: ACTION.LOGOUT, time: new Date(2025, 3, 1, 12, 30) },
        { action: ACTION.LOGIN, time: new Date(2025, 3, 1, 13, 30) },
      ]),
    ).toBe('10:30-12:30, 13:30-');
  });

  test('should be "23:00-01:00"', () => {
    expect(
      getTimeIntervals([
        { action: ACTION.LOGIN, time: new Date(2025, 3, 1, 23, 0) },
        { action: ACTION.LOGOUT, time: new Date(2025, 3, 2, 1, 0) },
      ]),
    ).toBe('23:00-01:00');
  });
});

describe('getTotalSeconds', () => {
  test('should be 0', () => {
    expect(getTotalSeconds([])).toBe(0);
  });

  test('should be 7200', () => {
    expect(
      getTotalSeconds([
        { action: ACTION.LOGIN, time: new Date(2025, 3, 1, 10, 30) },
        { action: ACTION.LOGOUT, time: new Date(2025, 3, 1, 12, 30) },
      ]),
    ).toBe(7200);
  });

  test('should be 45000', () => {
    expect(
      getTotalSeconds([
        { action: ACTION.LOGIN, time: new Date(2025, 3, 1, 10, 30) },
        { action: ACTION.LOGOUT, time: new Date(2025, 3, 1, 12, 30) },
        { action: ACTION.LOGIN, time: new Date(2025, 3, 1, 13, 30) },
      ]),
    ).toBe(45000);
  });
});
