import dayjs from 'dayjs';

import { ACTION, ConvertedTimeRecord, TimeRecord } from './types';

const TIME_FORMAT = 'HH:mm';

export function formatTime(date?: dayjs.ConfigType) {
  return dayjs(date).format(TIME_FORMAT);
}

export function secondsToString(value: number) {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;

  return [
    hours && `${hours} hour${hours > 1 ? 's' : ''}`,
    (hours || minutes) && `${minutes} minute${minutes > 1 ? 's' : ''}`,
    seconds + ` second${seconds > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function getTimeIntervals(records: ConvertedTimeRecord[]) {
  const sorted = [...records].sort((a, b) => +a.time - +b.time);
  const time: string[] = [];
  let lastLogin: Date | undefined;
  sorted.forEach(record => {
    if (record.action === ACTION.LOGIN) {
      lastLogin = record.time;
    } else if (lastLogin) {
      time.push([formatTime(lastLogin), formatTime(record.time)].join('-'));
      lastLogin = undefined;
    }
  });
  if (lastLogin) {
    time.push([formatTime(lastLogin), ''].join('-'));
  }

  return time.join(', ');
}

export function getTotalSeconds(records: ConvertedTimeRecord[]) {
  const sorted = [...records].sort((a, b) => +a.time - +b.time);
  let totalSeconds = 0;
  let lastLogin: Date | undefined;
  sorted.forEach(record => {
    if (record.action === ACTION.LOGIN) {
      lastLogin = record.time;
    } else if (lastLogin) {
      totalSeconds += Math.round(+record.time / 1000) - Math.round(+lastLogin / 1000);
      lastLogin = undefined;
    }
  });
  if (lastLogin) {
    totalSeconds += Math.round(Math.min(+dayjs(lastLogin).endOf('day'), Date.now()) / 1000) - Math.round(+lastLogin / 1000);
  }

  return totalSeconds;
}

export async function getRecordsFromStorage({ sort }: { sort?: 'asc' | 'desc' } = {}) {
  const items = await chrome.storage.local.get('records');
  const records = ((items.records || []) as TimeRecord[]).map(r => ({ ...r, time: new Date(r.time) }));
  if (sort === 'desc') records.sort((a, b) => +b.time - +a.time);
  else if (sort === 'asc') records.sort((a, b) => +a.time - +b.time);

  return records;
}

export async function addTimeRecord(value: TimeRecord) {
  const items = await chrome.storage.local.get('records');
  const records = (items.records as TimeRecord[]) || [];
  records.push(value);
  chrome.storage.local.set({ records });
}

export function hasKeys(obj: Record<string, unknown>, ...keys: string[]) {
  return Object.keys(obj).some(key => keys.includes(key));
}

export async function getLastLogin() {
  const records = await getRecordsFromStorage({ sort: 'desc' });

  return (records[0]?.action === ACTION.LOGIN && records[0].time) || undefined;
}
