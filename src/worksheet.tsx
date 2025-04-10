import './worksheet.less';

import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

import { ACTION, ConvertedTimeRecord, TimeRecord } from './types';
import { Dialog } from './dialog';
import { getRecordsFromStorage, getTimeIntervals, getTotalSeconds } from './lib';

const DATE_FORMAT = 'DD.MM.YYYY';

type WorksheetData = { date: string; dow: string; time: string; hours: number }[];

export function Worksheet() {
  const [counter, setCounter] = useState(0);
  const [start, setStart] = useState(() => dayjs().startOf('month'));
  const [records, setRecords] = useState<ConvertedTimeRecord[]>([]);
  const [worksheet, setWorksheet] = useState<WorksheetData>([]);

  const [date, setDate] = useState('');
  const [action, setAction] = useState(ACTION.LOGIN);
  const [time, setTime] = useState('');

  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === 'local' && Object.keys(changes).includes('records')) {
        setCounter(prev => prev + 1);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    let actual = true;
    (async () => {
      const result = await getRecordsFromStorage({ sort: 'desc' });
      if (!actual) return;
      setRecords(result);
      setStart(dayjs(result[0].time).startOf('month'));
    })();

    return () => {
      actual = false;
    };
  }, [counter]);

  useEffect(() => {
    let begin = dayjs(start);
    const end = dayjs(begin).endOf('month');
    const result: WorksheetData = [];
    while (+begin < +end) {
      const filtered = records.filter(r => dayjs(r.time).format(DATE_FORMAT) === begin.format(DATE_FORMAT));
      result.push({
        date: begin.format(DATE_FORMAT),
        dow: begin.format('ddd'),
        time: getTimeIntervals(filtered),
        hours: Math.round(getTotalSeconds(filtered) / 360) / 10,
      });
      begin = begin.add(1, 'day');
    }
    setWorksheet(result);
  }, [start, records]);

  const options = useMemo(() => {
    const result = new Set<string>();
    records.forEach(record => {
      result.add(dateToOption(dayjs(record.time)));
    });
    return [...result.values()];
  }, [records]);

  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const [month, year] = value.split(', ');
    const monthIndex = months.indexOf(month);
    const yearNumber = parseInt(year);
    const nextStart = dayjs(new Date(yearNumber, monthIndex, 1));
    setStart(nextStart);
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onDialogOpen = useCallback((value: string) => {
    setDate(value);
    setIsDialogOpen(true);
  }, []);

  const onDialogClose = useCallback(() => {
    setDate('');
    setIsDialogOpen(false);
  }, []);

  const onSubmit = () => {
    const [day, month, year] = date.split('.');
    const [hour, minute] = time.split(':');
    chrome.storage.local.get('records', items => {
      const result = (items.records || []) as TimeRecord[];
      result.push({
        time: new Date(+year, +month - 1, +day, +hour, +minute, 0, 0).toISOString(),
        action,
      });
      result.sort((a, b) => +dayjs(a.time) - +dayjs(b.time));
      chrome.storage.local.set({ records: result });
      onDialogClose();
      setCounter(p => p + 1);
    });
  };

  const totalHours = Math.round(worksheet.reduce((acc, { hours }) => acc + hours, 0) * 10) / 10;

  return (
    <>
      <div className="worksheet_header">
        <h3>Worksheet</h3>
        <select className="input" name="select" value={dateToOption(start)} onChange={onChange}>
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <table className="zig-zag">
        <thead>
          <tr>
            <th colSpan={2}>Day</th>
            <th>Time</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          {worksheet.map(w => (
            <tr key={w.date}>
              <td>{w.date}</td>
              <td>{w.dow}</td>
              <td className="action">
                {w.time}
                <span role="button" onClick={() => onDialogOpen(w.date)}>
                  +
                </span>
              </td>
              <td className="right">{['Sat', 'Sun'].includes(w.dow) && !w.hours ? '' : w.hours}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}></td>
            <th>{totalHours}</th>
          </tr>
        </tfoot>
      </table>
      <Dialog
        isOpen={isDialogOpen}
        className="add_dialog"
        onClose={onDialogClose}
        title="Add work time"
        buttons={[
          <button key="submit" className="button" onClick={onSubmit}>
            Submit
          </button>,
          <button key="cancel" className="button cancel" onClick={onDialogClose}>
            Cancel
          </button>,
        ]}
      >
        <ul className="content">
          <li>
            <b>Date:</b> {date}
          </li>
          <li>
            <label>
              <b>Action:</b>{' '}
              <select className="input" value={action} onChange={event => setAction(event.target.value as ACTION)}>
                <option value={ACTION.LOGIN}>Login</option>
                <option value={ACTION.LOGOUT}>Logout</option>
              </select>
            </label>
          </li>
          <li>
            <label>
              <b>Time:</b> <input className="input" type="time" lang="ru" value={time} onChange={event => setTime(event.target.value)} />
            </label>
          </li>
        </ul>
      </Dialog>
    </>
  );
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const dateToOption = (date: Dayjs) => `${months[date.get('month')]}, ${date.get('year')}`;
