import { useCallback, useEffect, useState } from 'react';

export const useSafeHeight = () => {
  const [safeHeight, setSafeHeight] = useState(0);

  const getSafeHeight = useCallback(() => {
    const value = window.visualViewport?.height ?? window.innerHeight;
    setSafeHeight((prev) => (prev === value ? prev : value));
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;

    getSafeHeight();

    window.visualViewport.addEventListener('resize', getSafeHeight);

    return () =>
      window.visualViewport?.removeEventListener('resize', getSafeHeight);
  }, [getSafeHeight]);

  useEffect(() => {
    if (!window) return;

    getSafeHeight();

    window.addEventListener('resize', getSafeHeight);

    return () => window.removeEventListener('resize', getSafeHeight);
  }, [getSafeHeight]);

  return safeHeight;
};
