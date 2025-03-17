import './worksheet.css';

import React, { useEffect, useMemo, useState } from 'react';

import { ConvertedTimeRecord, TimeRecord } from './types';
import { endOfMonth, formatDate, getTimeIntervals, getTotalSeconds, startOfMonth } from './lib';

type WorksheetData = Array<{ date: string; time: string; hours: number }>;

export const Worksheet = () => {
  const [start, setStart] = useState(startOfMonth());
  const [records, setRecords] = useState<ConvertedTimeRecord[]>([]);
  const [worksheet, setWorksheet] = useState<WorksheetData>([]);

  useEffect(() => {
    chrome.storage.local.get('records', items => {
      const result = ((items.records || []) as TimeRecord[]).map(r => ({ ...r, time: new Date(r.time) }));
      result.sort((a, b) => +b.time - +a.time);
      setRecords(result);
    });
  }, []);

  useEffect(() => {
    const end = endOfMonth(start);
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
  }, [records]);

  const options = useMemo(() => {
    const result = new Set<string>();
    records.forEach(record => {
      result.add(`${months[record.time.getMonth()]}, ${record.time.getFullYear()}`);
    });
    return [...result.values()];
  }, [start, records]);

  const totalHours = Math.round(worksheet.reduce((acc, { hours }) => acc + hours, 0) * 10) / 10;

  return (
    <>
      <div className="worksheet_header">
        <h3>Worksheet</h3>
        <select name="select" value={`${months[start.getMonth()]}, ${start.getFullYear()}`}>
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
            <th>{totalHours}</th>
          </tr>
        </tfoot>
      </table>
    </>
  );
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
