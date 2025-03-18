import './worksheet.css';

import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

import { ConvertedTimeRecord, TimeRecord } from './types';
import { getTimeIntervals, getTotalSeconds } from './lib';

const DATE_FORMAT = 'DD.MM.YYYY';

type WorksheetData = Array<{ date: string; dow: string; time: string; hours: number }>;

export const Worksheet = () => {
  const [start, setStart] = useState(() => dayjs().startOf('month'));
  const [records, setRecords] = useState<ConvertedTimeRecord[]>([]);
  const [worksheet, setWorksheet] = useState<WorksheetData>([]);

  useEffect(() => {
    chrome.storage.local.get('records', items => {
      const result = ((items.records || []) as TimeRecord[]).map(r => ({ ...r, time: new Date(r.time) }));
      result.sort((a, b) => +b.time - +a.time);
      setRecords(result);
      setStart(dayjs(result[0].time).startOf('month'));
    });
  }, []);

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

  const totalHours = Math.round(worksheet.reduce((acc, { hours }) => acc + hours, 0) * 10) / 10;

  return (
    <>
      <div className="worksheet_header">
        <h3>Worksheet</h3>
        <select name="select" value={dateToOption(start)} onChange={onChange}>
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
              <td>{w.time}</td>
              <td className="right">{(['Sat', 'Sun'].includes(w.dow) && !w.hours && '') || w.hours}</td>
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
    </>
  );
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const dateToOption = (date: Dayjs) => `${months[date.get('month')]}, ${date.get('year')}`;
