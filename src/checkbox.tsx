import './checkbox.less';

import { InputHTMLAttributes } from 'react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function Checkbox(props: CheckboxProps) {
  return (
    <div className="checkbox">
      <input {...props} type="checkbox" />
      <span className="check"></span>
    </div>
  );
}
