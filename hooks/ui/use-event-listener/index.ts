import { useEffect, useRef } from 'react';

const useEventListener = (
  eventType: keyof WindowEventMap,
  callback: (event?: Event) => void,
  runOnInit = false,
  target?: Element
): void => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // biome-ignore lint/correctness/useExhaustiveDependencies: stable ref pattern
  useEffect(() => {
    const handler = (event?: Event) => callbackRef.current(event);
    if (runOnInit) handler();
    const el = target ?? window;
    el.addEventListener(eventType, handler as EventListener);
    return () => el.removeEventListener(eventType, handler as EventListener);
  }, [eventType, target, runOnInit]);
};

export default useEventListener;
