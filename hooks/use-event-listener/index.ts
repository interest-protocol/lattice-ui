import { useEffect } from 'react';

const useEventListener = (
  eventType: keyof WindowEventMap,
  callback: (event?: Event) => void,
  runOnInit = false,
  target?: Element
): void => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only effect
  useEffect(() => {
    runOnInit && callback();
    (target ?? window).addEventListener(eventType, callback);
    return () => (target ?? window).removeEventListener(eventType, callback);
  }, []);
};

export default useEventListener;
