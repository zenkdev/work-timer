import './popup.css';

import React, { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ACTION, TimeRecord } from './types';
import { Counter } from './counter';

enum STATE {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

const Popup = () => {
  const [state, setState] = useState(STATE.OFFLINE);
  const [seconds, setSeconds] = useState(0);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);

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

  return (
    <div className="popup">
      <div className="state">
        <List state={state} seconds={seconds} />
        <Buttons state={state} setState={setState} openWorksheet={() => setIsWorksheetOpen(true)} />
      </div>
      <Worksheet isOpen={isWorksheetOpen} onClose={() => setIsWorksheetOpen(false)} />
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
  openWorksheet(): void;
};

const Buttons = ({ state, setState, openWorksheet }: ButtonsProps) => {
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

  const buttonText = (state === STATE.ONLINE && 'logout') || 'login';
  const action = (state === STATE.ONLINE && ACTION.LOGOUT) || ACTION.LOGIN;
  const nextState = (state === STATE.ONLINE && STATE.OFFLINE) || STATE.ONLINE;

  const runAction = () =>
    chrome.storage.local.get('records', items => {
      const records = (items.records as TimeRecord[]) || [];
      records.push({ action, time: new Date().toJSON() });
      chrome.storage.local.set({ records });
      setState(nextState);
    });

  const openOptionsPage = () => chrome.runtime.openOptionsPage();

  return (
    <div className="buttons">
      <button onClick={runAction}>{buttonText}</button>
      <button onClick={openWorksheet}>worksheet</button>
      {/* <button onClick={changeBackground}>change background</button> */}
      <button onClick={openOptionsPage}>options</button>
    </div>
  );
};

type WorksheetData = Array<{ date: string; time: string; hours: number }>;

type WorksheetProps = {
  isOpen: boolean;
  onClose(): void;
};

const Worksheet = ({ isOpen, onClose }: WorksheetProps) => {
  const modal = useRef<HTMLDialogElement>(null);
  const [worksheet, setWorksheet] = useState<WorksheetData>([]);

  useEffect(() => {
    if (isOpen) {
      chrome.storage.local.get('records', items => {
        const records = ((items.records || []) as TimeRecord[]).map(r => ({ ...r, time: new Date(r.time) }));
        records.sort((a, b) => +b.time - +a.time);
        const start = startOfMonth();
        const end = endOfMonth();
        const result: WorksheetData = [];
        while (+start < +end) {
          const filtered = records.filter(r => formatDate(r.time) === formatDate(start));
          result.push({
            date: formatDate(start),
            time: getTimeIntervals(filtered),
            hours: Math.round(getTotalSeconds(filtered) / 360) / 10,
          });
          start.setDate(start.getDate() + 1);
        }
        setWorksheet(result);
        modal.current?.showModal();
      });
    } else {
      modal.current?.close();
    }
  }, [isOpen]);

  const onClick = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    if (modal.current) {
      const modalRect = modal.current.getBoundingClientRect();

      if (
        event.clientX < modalRect.left ||
        event.clientX > modalRect.right ||
        event.clientY < modalRect.top ||
        event.clientY > modalRect.bottom
      ) {
        modal.current.close();
      }
    }
  }, []);

  return (
    <dialog id="modal" ref={modal} onClick={onClick} onClose={onClose}>
      <table className="zig-zag">
        <thead>
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          {worksheet.map(w => (
            <tr key={w.date}>
              <td>{w.date}</td>
              <td>{w.time}</td>
              <td>{w.hours}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}></td>
            <th>{worksheet.reduce((acc, { hours }) => acc + hours, 0)}</th>
          </tr>
        </tfoot>
      </table>
    </dialog>
  );
};

function formatDate(date: Date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(n => String(n).padStart(2, '0')).join('.');
}

function formatTime(date: Date) {
  return [date.getHours(), date.getMinutes()].map(n => String(n).padStart(2, '0')).join(':');
}

function secondsToString(seconds: number) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var seconds = seconds % 60;
  return [hours && `${hours} hours`, (hours || minutes) && `${minutes} minutes`, seconds + ' seconds'].filter(Boolean).join(' ');
}

type Filtered = { action: ACTION; time: Date };

function getTimeIntervals(records: Filtered[]) {
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

function getTotalSeconds(records: Filtered[]) {
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
