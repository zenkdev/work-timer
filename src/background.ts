import dayjs from 'dayjs';

import iconUrl from './assets/icon.png';
import { formatTime, getLastLogin, hasKeys } from './lib';

const REST_ALARM = 'rest-alarm';
const WORK_ALARM = 'work-alarm';

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  console.log('onAlarm', name);

  if (name !== REST_ALARM && name !== WORK_ALARM) {
    return;
  }

  const { notify } = await chrome.storage.sync.get({ notify: false });
  const lastLogin = await getLastLogin();

  if (!notify || !lastLogin) {
    console.log('clear all alarms');
    chrome.alarms.clearAll();

    return;
  }

  const message = name === WORK_ALARM ? "Let's keep working!" : "Let's take a break!";
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
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('onInstalled', reason);

  chrome.storage.onChanged.addListener(onStorageChanged);

  checkAlarms();
  updateBadgeText();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('onStartup');

  if (!chrome.storage.onChanged.hasListener(onStorageChanged)) {
    chrome.storage.onChanged.addListener(onStorageChanged);
  }

  checkAlarms();
  updateBadgeText();
});

function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) {
  if (
    (areaName === 'sync' && hasKeys(changes, 'notify', 'workTime', 'restTime')) ||
    (areaName === 'local' && hasKeys(changes, 'records'))
  ) {
    checkAlarms();
  }
}

function checkAlarms() {
  (async () => {
    const { notify, workTime, restTime } = await chrome.storage.sync.get({ notify: false, workTime: 45, restTime: 15 });
    const lastLogin = await getLastLogin();

    if (!notify || !lastLogin) {
      console.log('clear all alarms');
      chrome.alarms.clearAll();
    } else {
      const periodInMinutes = workTime + restTime;
      const minutesSinceLastLogin = dayjs(Date.now()).diff(lastLogin, 'minute');

      let delayInMinutes = workTime - (minutesSinceLastLogin % periodInMinutes);
      console.log('create alarm', REST_ALARM, { delayInMinutes, periodInMinutes, lastLogin: formatTime(lastLogin) });
      chrome.alarms.create(REST_ALARM, { delayInMinutes, periodInMinutes });

      delayInMinutes += restTime;
      console.log('create alarm', WORK_ALARM, { delayInMinutes, periodInMinutes, lastLogin: formatTime(lastLogin) });
      chrome.alarms.create(WORK_ALARM, { delayInMinutes, periodInMinutes });
    }
  })();
}

function updateBadgeText() {
  (async () => {
    const lastLogin = await getLastLogin();
    chrome.action.setBadgeText({ text: lastLogin ? 'in' : 'out' });
  })();
}
