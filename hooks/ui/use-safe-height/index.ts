import { useEffect, useState } from 'react';

export const useSafeHeight = () => {
  const [safeHeight, setSafeHeight] = useState(() =>
    typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 0
  );

  useEffect(() => {
    const updateHeight = () => {
      const value = window.visualViewport?.height ?? window.innerHeight;
      setSafeHeight((prev) => (prev === value ? prev : value));
    };

    updateHeight();

    window.visualViewport?.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return safeHeight;
};
