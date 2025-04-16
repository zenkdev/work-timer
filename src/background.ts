import dayjs from 'dayjs';

import iconUrl from './assets/icon.png';
import { SyncStorage } from './types';

const ALARM_NAME = 'notify';
const ALARM_OPTIONS = { type: 'basic' as const, title: 'Work Timer', iconUrl, requireInteraction: true };

function noop() {
  // empty
}

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  console.log('onAlarm', name);

  const settings = await chrome.storage.sync.get<SyncStorage>(['notify', 'workTime', 'restTime', 'lastLogin']);
  if (!settings.notify || !settings.lastLogin) return;

  const workTime = settings.workTime || 45;
  const restTime = settings.restTime || 15;
  const lastLogin = dayjs(settings.lastLogin);
  const passed = dayjs(Date.now()).diff(lastLogin, 'minute');
  const diff = passed % (workTime + restTime);

  console.log('passed', passed, 'diff', diff);

  if (passed > 0 && (diff === workTime || diff === 0)) {
    const message = diff === 0 ? "Let's keep working!" : "Let's take a break!";

    console.log('notify', message);

    chrome.notifications.create('', { ...ALARM_OPTIONS, message }, noop);
  }
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('onInstalled', reason);

  createAlarm();
  updateBadgeText();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('onStartup');

  createAlarm();
  updateBadgeText();
});

function createAlarm() {
  chrome.alarms.clearAll(() => {
    console.log('create alart', ALARM_NAME);
    chrome.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: 1 });
  });
}

function updateBadgeText() {
  (async () => {
    const { lastLogin } = await chrome.storage.sync.get({ lastLogin: null });
    chrome.action.setBadgeText({ text: lastLogin ? 'in' : 'out' });
  })();
}
