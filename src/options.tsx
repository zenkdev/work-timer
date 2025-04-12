import './_common.less';
import './options.less';

import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { csv2json, json2csv } from 'json-2-csv';

import { ACTION, TimeRecord } from './types';
import { Checkbox } from './checkbox';
import { Dialog } from './dialog';
import { Worksheet } from './worksheet';

function Options() {
  const [notify, setNotify] = useState(false);
  const [workTime, setWorkTime] = useState(45);
  const [restTime, setRestTime] = useState(15);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onDialogOpen = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const onDialogClose = useCallback(() => {
    chrome.storage.sync.set({ notify, workTime, restTime }, () => setIsDialogOpen(false));
  }, [notify, restTime, workTime]);

  useEffect(() => {
    // Restores select box and checkbox state using the preferences stored in chrome.storage.
    chrome.storage.sync.get({ notify: false, workTime: 45, restTime: 15 }, items => {
      setNotify(items.notify);
      setWorkTime(items.workTime);
      setRestTime(items.restTime);
    });
  }, []);

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
      <Dialog
        isOpen={isDialogOpen}
        className="notify_dialog"
        onClose={onDialogClose}
        title="Setup notifications"
        buttons={[
          <button key="clode" className="button cancel" onClick={() => setIsDialogOpen(false)}>
            Close
          </button>,
        ]}
      >
        <ul className="content">
          <li>
            <label>
              Enable notifications:
              <Checkbox checked={notify} onChange={e => setNotify(e.target.checked)} />
            </label>
          </li>
          <li>
            <label>
              Work time (min):
              <input
                className="input"
                type="number"
                value={workTime}
                onChange={e => setWorkTime(e.target.valueAsNumber)}
                disabled={!notify}
                style={{ width: 90 }}
              />
            </label>
          </li>
          <li>
            <label>
              Rest time (min):
              <input
                className="input"
                type="number"
                value={restTime}
                onChange={e => setRestTime(e.target.valueAsNumber)}
                disabled={!notify}
                style={{ width: 90 }}
              />
            </label>
          </li>
        </ul>
      </Dialog>

      <div className="buttons">
        <button className="button" onClick={onDialogOpen}>
          Notifications
        </button>
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
