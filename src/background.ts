import { ACTION } from './types';
import { getRecordsFromStorage } from './lib';

// function polling() {
//   // console.log('polling');
//   setTimeout(polling, 1000 * 30);
// }

// polling();

(async () => {
  const records = await getRecordsFromStorage({ sort: 'desc' });
  const text = records[0]?.action === ACTION.LOGIN ? 'in' : 'out';
  chrome.action.setBadgeText({ text });
})();
