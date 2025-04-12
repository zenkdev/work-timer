import './dialog.less';

import { MouseEvent, PropsWithChildren, ReactNode, useCallback, useEffect, useRef } from 'react';

interface DialogProps extends PropsWithChildren {
  className?: string;
  isOpen?: boolean;
  onClose?(): void;
  title?: ReactNode;
  buttons?: ReactNode[];
}

export function Dialog({ className, children, isOpen = false, onClose, title, buttons }: DialogProps) {
  const modal = useRef<HTMLDialogElement>(null);
  const prev = useRef(isOpen);

  useEffect(() => {
    if (isOpen !== prev.current) {
      if (isOpen) {
        modal.current?.showModal();
      } else {
        modal.current?.close();
      }
    }
    prev.current = isOpen;
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
        modal.current?.close();
      }
    }
  }, []);

  const dialogClassName = ['dialog', className].filter(Boolean).join(' ');

  return (
    <dialog ref={modal} className={dialogClassName} onClick={onClick} onClose={onClose}>
      {title ? <h2 className="dialog-title">{title}</h2> : null}
      {children ? <div className="dialog-content">{children}</div> : null}
      {buttons ? <div className="dialog-buttons">{buttons}</div> : null}
    </dialog>
  );
}
