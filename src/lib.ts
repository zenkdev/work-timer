import { ACTION, ConvertedTimeRecord } from './types';

export function formatDate(date: Date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(n => String(n).padStart(2, '0')).join('.');
}

export function formatTime(date: Date) {
  return [date.getHours(), date.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
}

export function secondsToString(seconds: number) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var seconds = seconds % 60;
  return [hours && `${hours} hours`, (hours || minutes) && `${minutes} minutes`, seconds + ' seconds'].filter(Boolean).join(' ');
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
    totalSeconds += Math.round(Math.min(+endOfDay(lastLogin), Date.now()) / 1000) - Math.round(+lastLogin / 1000);
  }
  return totalSeconds;
}

export function startOfDay(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}
