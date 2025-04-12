import dayjs from 'dayjs';

import iconUrl from './assets/icon.png';
import { ACTION } from './types';
import { getRecordsFromStorage } from './lib';

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  console.log('onAlarm', name);
  const {
    notify = false,
    workTime = 45,
    restTime = 15,
  } = await chrome.storage.sync.get({
    notify: false,
    workTime: 45,
    restTime: 15,
  });

  if (!notify) return;

  const records = await getRecordsFromStorage({ sort: 'desc' });
  if (records[0]?.action === ACTION.LOGIN) {
    const passed = dayjs(Date.now()).diff(records[0].time, 'minute');
    const diff = passed % (workTime + restTime);
    console.log('passed', passed, 'diff', diff);
    if (passed > 0 && (diff === workTime || diff === 0)) {
      const message = diff === 0 ? "Let's keep working!" : "Let's take a break!";
      console.log('notify', message);
      chrome.notifications.create(
        '',
        {
          type: 'basic',
          title: 'Work Timer',
          message,
          iconUrl,
          requireInteraction: true,
        },
        function () {
          // empty
        },
      );
    }
  }
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.log('onInstalled', reason);

  await createReminder();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('onStartup');

  const records = await getRecordsFromStorage({ sort: 'desc' });
  const text = records[0]?.action === ACTION.LOGIN ? 'in' : 'out';
  chrome.action.setBadgeText({ text });

  await createReminder();
});

async function createReminder() {
  const reminder = await chrome.alarms.get('remider');
  if (!reminder) {
    console.log('create reminder');
    chrome.alarms.create('remider', {
      delayInMinutes: 1,
      periodInMinutes: 1,
    });
  }
}
