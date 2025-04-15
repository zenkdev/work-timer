import './button.less';

import { ComponentType, MouseEventHandler, PropsWithChildren } from 'react';

interface ButtonProps extends PropsWithChildren {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  isCancel?: boolean;
  as?: string;
  className?: string;
}

export function Button({ onClick, isCancel, as = 'button', className, children }: ButtonProps) {
  const cn = ['button', isCancel && 'cancel', className].filter(Boolean).join(' ');
  const Comp = as as unknown as ComponentType<ButtonProps>;

  return (
    <Comp className={cn} onClick={onClick}>
      {children}
    </Comp>
  );
}
