import './counter.css';

interface CounterProps {
  seconds: number;
}

export function Counter({ seconds }: CounterProps) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const digit1 = Math.floor(h / 10);
  const digit2 = h - digit1 * 10;

  const digit3 = Math.floor(m / 10);
  const digit4 = m - digit3 * 10;

  const digit5 = Math.floor(s / 10);
  const digit6 = s - digit5 * 10;

  return (
    <div id="counter">
      <div className="counter_item">
        <Digit value={digit1} />
      </div>
      <div className="counter_item">
        <Digit value={digit2} />
      </div>
      <div className="counter_item">
        <div className="digit digit_colon">:</div>
      </div>
      <div className="counter_item">
        <Digit value={digit3} />
      </div>
      <div className="counter_item">
        <Digit value={digit4} />
      </div>
      <div className="counter_item">
        <div className="digit digit_colon">:</div>
      </div>
      <div className="counter_item">
        <Digit value={digit5} />
      </div>
      <div className="counter_item">
        <Digit value={digit6} />
      </div>
    </div>
  );
}

interface DigitProps {
  value: number;
}

function Digit({ value }: DigitProps) {
  return (
    <div className={`digit digit_${value}`}>
      <span>0</span>
      <span>1</span>
      <span>2</span>
      <span>3</span>
      <span>4</span>
      <span>5</span>
      <span>6</span>
      <span>7</span>
      <span>8</span>
      <span>9</span>
    </div>
  );
}
