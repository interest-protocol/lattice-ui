import { type RefObject, useEffect, useRef } from 'react';

type noop = () => void;
type OnClose = (event: MouseEvent) => void;

const useClickOutsideListenerRef = <T extends HTMLElement>(
  onClose: OnClose | noop
): RefObject<T> => {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const clickListener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        onCloseRef.current(e);
    };
    const escapeListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (onCloseRef.current as noop)();
    };
    document.addEventListener('click', clickListener);
    document.addEventListener('keyup', escapeListener);
    return () => {
      document.removeEventListener('click', clickListener);
      document.removeEventListener('keyup', escapeListener);
    };
  }, []);

  return ref;
};

export default useClickOutsideListenerRef;
