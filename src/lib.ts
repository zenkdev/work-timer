import dayjs from 'dayjs';

import { ACTION, ConvertedTimeRecord } from './types';

const TIME_FORMAT = 'HH:mm';

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
      time.push([dayjs(lastLogin).format(TIME_FORMAT), dayjs(record.time).format(TIME_FORMAT)].join('-'));
      lastLogin = undefined;
    }
  });
  if (lastLogin) {
    time.push([dayjs(lastLogin).format(TIME_FORMAT), ''].join('-'));
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
