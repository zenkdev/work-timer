import dayjs from 'dayjs';

import iconUrl from './assets/icon.png';
import { ACTION } from './types';
import { getRecordsFromStorage } from './lib';

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  console.log('onAlarm', name);
  const { every = 45, pause = 15 } = await chrome.storage.sync.get(['every', 'pause']);

  const records = await getRecordsFromStorage({ sort: 'desc' });
  if (records[0]?.action === ACTION.LOGIN) {
    const passed = dayjs(Date.now()).diff(records[0].time, 'minute');
    const diff = passed % (every + pause);
    console.log('passed', passed, 'diff', diff);
    if (passed > 0 && (diff === every || diff === 0)) {
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

  // if (reason !== 'install') {
  //   return;
  // }

  const reminder = await chrome.alarms.get('remider');
  if (!reminder) {
    console.log('create reminder');
    chrome.alarms.create('remider', {
      delayInMinutes: 1,
      periodInMinutes: 1,
    });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('onStartup');

  const records = await getRecordsFromStorage({ sort: 'desc' });
  const text = records[0]?.action === ACTION.LOGIN ? 'in' : 'out';
  chrome.action.setBadgeText({ text });

  const reminder = await chrome.alarms.get('remider');
  if (!reminder) {
    console.log('restore reminder');
    chrome.alarms.create('remider', {
      delayInMinutes: 1,
      periodInMinutes: 1,
    });
  }
});
