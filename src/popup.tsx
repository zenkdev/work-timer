import './popup.css';

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Counter } from './counter';

enum ACTION {
  LOGIN = 'login',
  LOGOUT = 'logout',
}

enum STATE {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

type TimeRecord = {
  action: ACTION;
  time: string;
};

const Popup = () => {
  const [state, setState] = useState(STATE.OFFLINE);
  const [seconds, setSeconds] = useState(0);
  const [worksheet, setWorksheet] = useState<[string, number][]>();

  useEffect(() => {
    chrome.action.setBadgeText({ text: state === STATE.ONLINE ? 'in' : 'out' });

    if (state === STATE.OFFLINE) return;

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
  }, [state]);

  useEffect(() => {
    chrome.storage.local.get('records', items => {
      const records = ((items.records || []) as TimeRecord[]).map(r => ({ ...r, time: new Date(r.time) }));
      records.sort((a, b) => +b.time - +a.time);
      const lastState = records[0]?.action === ACTION.LOGIN ? STATE.ONLINE : STATE.OFFLINE;
      setState(lastState);
      const todayStart = +startOfDay();
      setSeconds(getTotalSeconds(records.filter(r => +r.time >= todayStart)));
    });
    // const cb = (changes, namespace) => {
    //   for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    //     console.log(
    //       `Storage key "${key}" in namespace "${namespace}" changed.`,
    //       `Old value was "${oldValue}", new value is "${newValue}".`,
    //     );
    //   }
    // };
    // chrome.storage.onChanged.addListener(cb);
    // return () => chrome.storage.onChanged.removeListener(cb);
  }, []);

  const toggleWorksheet = () => {
    if (worksheet) {
      setWorksheet(undefined);
      return;
    }

    chrome.storage.local.get('records', items => {
      const records = ((items.records || []) as TimeRecord[]).map(r => ({ ...r, time: new Date(r.time) }));
      records.sort((a, b) => +b.time - +a.time);
      const start = startOfMonth();
      const end = endOfMonth();
      const result: [string, number][] = [];
      while (+start < +end) {
        const dateStr = start.toDateString();
        result.push([dateStr, Math.round(getTotalSeconds(records.filter(r => r.time.toDateString() === dateStr)) / 360) / 10]);
        start.setDate(start.getDate() + 1);
      }
      setWorksheet(result);
    });
  };

  return (
    <div className="popup">
      {!worksheet && (
        <div className="state">
          <List state={state} seconds={seconds} />
          <Buttons state={state} setState={setState} toggleWorksheet={toggleWorksheet} />
        </div>
      )}
      {worksheet && (
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {worksheet.map(w => (
              <tr key={w[0]}>
                <td>{w[0]}</td>
                <td>{w[1]}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              <td>{worksheet.reduce((acc, cur) => acc + cur[1], 0)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
};

type ListProps = {
  state: STATE;
  seconds: number;
};

const List = ({ state, seconds }: ListProps) => {
  return (
    <ul className="list">
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
  );
};

type ButtonsProps = {
  state: STATE;
  setState(state: STATE): void;
  toggleWorksheet(): void;
};

const Buttons = ({ state, setState, toggleWorksheet }: ButtonsProps) => {
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

  const buttonText = state === STATE.ONLINE ? 'logout' : 'login';
  const action = { [STATE.ONLINE]: ACTION.LOGOUT, [STATE.OFFLINE]: ACTION.LOGIN }[state];
  const nextState = { [STATE.ONLINE]: STATE.OFFLINE, [STATE.OFFLINE]: STATE.OFFLINE }[state];

  const runAction = () =>
    chrome.storage.local.get('records', items => {
      const records = (items.records as TimeRecord[]) || [];
      records.push({ action, time: new Date().toJSON() });
      chrome.storage.local.set({ records });
      setState(nextState);
    });

  return (
    <div className="buttons">
      <button onClick={runAction}>{buttonText}</button>
      <button onClick={toggleWorksheet}>worksheet</button>
      {/* <button onClick={changeBackground}>change background</button> */}
      <button onClick={toggleWorksheet}>options</button>
    </div>
  );
};

function secondsToString(seconds: number) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var seconds = seconds % 60;
  return [hours && `${hours} hours`, (hours || minutes) && `${minutes} minutes`, seconds + ' seconds'].filter(Boolean).join(' ');
}

function getTotalSeconds(records: { action: ACTION; time: Date }[]) {
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

function startOfDay(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date?: Date) {
  const d = date ? new Date(+date) : new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
