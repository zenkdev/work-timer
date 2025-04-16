import { ACTION, SORT_ORDER } from '../types';
import { addAction, getRecordsFromStorage, getTimeIntervals, getTotalSeconds, secondsToString } from '../lib';

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

describe('getRecordsFromStorage', () => {
  const records = [
    { action: 'login', time: '2025-04-02T09:00:00.000Z' },
    { action: 'logout', time: '2025-04-02T12:00:00.000Z' },
    { action: 'login', time: '2025-04-01T09:00:00.000Z' },
    { action: 'logout', time: '2025-04-01T12:00:00.000Z' },
    { action: 'logout', time: '2025-04-03T12:00:00.000Z' },
    { action: 'login', time: '2025-04-03T09:00:00.000Z' },
  ];

  beforeEach(() => {
    (chrome.storage.local.get as jest.Mock).mockImplementation(() => ({ records }));
  });

  test('unsorted', async () => {
    const expected = records.map(record => ({ ...record, time: new Date(record.time) }));

    const result = await getRecordsFromStorage();

    expect(result).toStrictEqual(expected);
  });

  test('asc', async () => {
    const expected = records.map(record => ({ ...record, time: new Date(record.time) })).sort((a, b) => +a.time - +b.time);

    const result = await getRecordsFromStorage(SORT_ORDER.ASC);

    expect(result).toStrictEqual(expected);
  });

  test('desc', async () => {
    const expected = records.map(record => ({ ...record, time: new Date(record.time) })).sort((a, b) => +b.time - +a.time);

    const result = await getRecordsFromStorage(SORT_ORDER.DESC);

    expect(result).toStrictEqual(expected);
  });
});

describe('addAction', () => {
  const now = new Date(2025, 3, 10, 12, 0, 0);
  const records = [
    { action: 'login', time: '2025-04-01T09:00:00.000Z' },
    { action: 'logout', time: '2025-04-01T12:00:00.000Z' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now });
    (chrome.storage.local.get as jest.Mock).mockImplementation(() => ({ records }));
  });

  test('login', async () => {
    const action = ACTION.LOGIN;
    const expected = {
      local: { records: [...records, { action, time: now.toISOString() }] },
      sync: { lastLogin: now.toISOString() },
    };

    await addAction(action);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(expected.local);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(expected.sync);
  });

  test('logout', async () => {
    const action = ACTION.LOGOUT;
    const expected = {
      local: { records: [...records, { action, time: now.toISOString() }] },
      sync: { lastLogin: null },
    };

    await addAction(action);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(expected.local);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(expected.sync);
  });

  test('custom time', async () => {
    const action = ACTION.LOGIN;
    const time = new Date(2025, 3, 16);
    const expected = {
      local: { records: [...records, { action, time: time.toISOString() }] },
      sync: { lastLogin: time.toISOString() },
    };

    await addAction(action, time);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(expected.local);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(expected.sync);
  });
});
