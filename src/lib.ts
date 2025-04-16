import dayjs from 'dayjs';

import { ACTION, ConvertedTimeRecord, LocalStorage, SORT_ORDER } from './types';

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

export async function getRecordsFromStorage(order?: SORT_ORDER) {
  const items = await chrome.storage.local.get<LocalStorage>('records');
  const records = (items.records || []).map(r => ({ ...r, time: new Date(r.time) }));
  if (order === SORT_ORDER.DESC) records.sort((a, b) => +b.time - +a.time);
  else if (order === SORT_ORDER.ASC) records.sort((a, b) => +a.time - +b.time);

  return records;
}

export async function addAction(action: ACTION, time: Date = new Date()) {
  const items = await chrome.storage.local.get<LocalStorage>('records');

  const record = { action, time: time.toISOString() };
  const records = (items.records || []).concat(record);
  chrome.storage.local.set({ records });

  const lastLogin = record.action === ACTION.LOGIN ? record.time : null;

  chrome.storage.sync.set({ lastLogin });
}
