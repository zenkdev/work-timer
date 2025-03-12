import './counter.css';

import React, { useEffect, useState } from 'react';

type CounterProps = {
  seconds: number;
};

export const Counter = ({ seconds }: CounterProps) => {
  const [digit1, setDigit1] = useState(0);
  const [digit2, setDigit2] = useState(0);
  const [digit3, setDigit3] = useState(0);
  const [digit4, setDigit4] = useState(0);
  const [digit5, setDigit5] = useState(0);
  const [digit6, setDigit6] = useState(0);

  useEffect(() => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const d1 = Math.floor(h / 10);
    setDigit1(d1);
    setDigit2(h - d1 * 10);

    const d3 = Math.floor(m / 10);
    setDigit3(d3);
    setDigit4(m - d3 * 10);

    const d5 = Math.floor(s / 10);
    setDigit5(d5);
    setDigit6(s - d5 * 10);
  }, [seconds]);

  return (
    <div id="counter">
      <div id="counter_item1" className="counter_item">
        <div className="front"></div>
        <div className={`digit digit${digit1}`}></div>
      </div>
      <div id="counter_item2" className="counter_item">
        <div className="front"></div>
        <div className={`digit digit${digit2}`}></div>
      </div>
      <div id="counter_item3" className="counter_item">
        <div className="front"></div>
        <div className="digit digit_colon"></div>
      </div>
      <div id="counter_item4" className="counter_item">
        <div className="front"></div>
        <div className={`digit digit${digit3}`}></div>
      </div>
      <div id="counter_item5" className="counter_item">
        <div className="front"></div>
        <div className={`digit digit${digit4}`}></div>
      </div>
      <div id="counter_item6" className="counter_item">
        <div className="front"></div>
        <div className="digit digit_colon"></div>
      </div>
      <div id="counter_item7" className="counter_item">
        <div className="front"></div>
        <div className={`digit digit${digit5}`}></div>
      </div>
      <div id="counter_item8" className="counter_item">
        <div className="front"></div>
        <div className={`digit digit${digit6}`}></div>
      </div>
    </div>
  );
};
