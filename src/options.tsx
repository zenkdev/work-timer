import './options.css';

import React, { ChangeEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { csv2json, json2csv } from 'json-2-csv';

import { ACTION, TimeRecord } from './types';
import { Worksheet } from './worksheet';

function Options() {
  const [color, setColor] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [like, setLike] = useState<boolean>(false);

  useEffect(() => {
    // Restores select box and checkbox state using the preferences stored in chrome.storage.
    chrome.storage.sync.get(
      {
        favoriteColor: 'red',
        likesColor: true,
      },
      items => {
        setColor(items.favoriteColor);
        setLike(items.likesColor);
      },
    );
  }, []);

  const saveOptions = () => {
    // Saves options to chrome.storage.sync.
    chrome.storage.sync.set(
      {
        favoriteColor: color,
        likesColor: like,
      },
      () => {
        // Update status to let user know options were saved.
        setStatus('Options saved.');
        const id = setTimeout(() => {
          setStatus('');
        }, 1000);
        return () => clearTimeout(id);
      },
    );
  };

  const importLogs = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      try {
        const csv = await file.text();
        const js = csv2json(csv) as TimeRecord[];
        const r = js.map(record => {
          if (record.action !== 'login' && record.action !== 'logout') {
            throw new Error('Invalid action');
          }
          new Date(record.time);
          return { action: record.action as ACTION, time: record.time };
        });
        chrome.storage.local.set({ records: r });
      } catch (error) {
        console.error('Invalid file.', error);
      }
    } else {
      console.error('Invalid file type.');
    }
  };

  const exportLogs = () =>
    chrome.storage.local.get('records', items => {
      const records = items.records as TimeRecord[];
      if (records?.length > 0) {
        const csv = json2csv(records);
        download(csv);
      }
    });

  return (
    <div className="container">
      <div className="hidden">
        <div>
          Favorite color:{' '}
          <select value={color} onChange={event => setColor(event.target.value)}>
            <option value="red">red</option>
            <option value="green">green</option>
            <option value="blue">blue</option>
            <option value="yellow">yellow</option>
          </select>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={like} onChange={event => setLike(event.target.checked)} />I like colors.
          </label>
        </div>
        <div>{status}</div>
        <button onClick={saveOptions}>Save</button>
      </div>
      <div className="buttons">
        <label className="button">
          Import logs
          <input type="file" onChange={importLogs} className="visually-hidden" />
        </label>
        <button className="button" onClick={exportLogs}>
          Export logs
        </button>
      </div>
      <hr />
      <Worksheet />
    </div>
  );
}

const download = (data: string) => {
  // Create a Blob with the CSV data and type
  const blob = new Blob([data], { type: 'text/csv' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create an anchor tag for downloading
  const a = document.createElement('a');

  // Set the URL and download attribute of the anchor tag
  a.href = url;
  a.download = 'download.csv';

  // Trigger the download by clicking the anchor tag
  a.click();
};

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
