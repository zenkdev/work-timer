import './_common.less';
import './popup.less';

import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ACTION, SORT_ORDER } from './types';
import { Button } from './button';
import { Counter } from './counter';
import { addAction, getRecordsFromStorage, getTotalSeconds, secondsToString } from './lib';

function Popup() {
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
    let actual = true;
    (async () => {
      const records = await getRecordsFromStorage(SORT_ORDER.DESC);
      if (!actual) return;
      setOnline(records[0]?.action === ACTION.LOGIN);
      const todayStart = +dayjs().startOf('day');
      setSeconds(getTotalSeconds(records.filter(r => +r.time >= todayStart)));
    })();

    return () => {
      actual = false;
    };
  }, []);

  const state = (online && 'online') || 'offline';

  const runAction = async () => {
    await addAction((online && ACTION.LOGOUT) || ACTION.LOGIN);
    setOnline(!online);
  };

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
        <Button isCancel={online} onClick={runAction}>
          {(online && 'logout') || 'login'}
        </Button>
        <Button onClick={openOptionsPage}>options</Button>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
