import './popup.css';

import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ACTION, TimeRecord } from './types';
import { Counter } from './counter';
import { getTotalSeconds, secondsToString } from './lib';

const Popup = () => {
  const [online, setOnline] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    chrome.action.setBadgeText({ text: online ? 'in' : 'out' });

    if (!online) return;

    let interval: NodeJS.Timer;
    let lastTime = Math.round(+Date.now() / 1000);
    const cb = () => {
      const thisTime = Math.round(+Date.now() / 1000);
      setSeconds(prev => prev + (thisTime - lastTime));
      lastTime = thisTime;
      interval = setTimeout(cb, 1000);
    };
    interval = setTimeout(cb, 1000);

    return () => clearTimeout(interval);
  }, [online]);

  useEffect(() => {
    chrome.storage.local.get('records', items => {
      const records = ((items.records || []) as TimeRecord[]).map(r => ({ ...r, time: new Date(r.time) }));
      records.sort((a, b) => +b.time - +a.time);
      setOnline(records[0]?.action === ACTION.LOGIN);
      const todayStart = +dayjs().startOf('day');
      setSeconds(getTotalSeconds(records.filter(r => +r.time >= todayStart)));
    });
  }, []);

  // const changeBackground = () => {
  //   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //     const tab = tabs[0];
  //     if (tab.id) {
  //       chrome.tabs.sendMessage(
  //         tab.id,
  //         {
  //           color: '#555555',
  //         },
  //         msg => {
  //           console.log('result message:', msg);
  //         },
  //       );
  //     }
  //   });
  // };
  const state = (online && 'online') || 'offline';

  const runAction = () =>
    chrome.storage.local.get('records', items => {
      const records = (items.records as TimeRecord[]) || [];
      records.push({ action: (online && ACTION.LOGOUT) || ACTION.LOGIN, time: new Date().toJSON() });
      chrome.storage.local.set({ records });
      setOnline(!online);
    });

  const openOptionsPage = () => chrome.runtime.openOptionsPage();

  return (
    <div className="container">
      <ul className="state">
        <li>
          <span className="title">State:</span>
          <span className={state}>{state}</span>
        </li>
        <li>
          <span className="title">Work Time:</span>
          <span>{secondsToString(seconds)}</span>
        </li>
        <li>
          <Counter seconds={seconds} />
        </li>
      </ul>
      <div className="buttons">
        <button onClick={runAction}>{(online && 'logout') || 'login'}</button>
        {/* <button onClick={changeBackground}>change background</button> */}
        <button onClick={openOptionsPage}>options</button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
