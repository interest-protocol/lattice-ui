export const createRouteLogger = (routeName: string) => {
  const t0 = performance.now();
  const elapsed = () => ((performance.now() - t0) / 1000).toFixed(1);
  return {
    info: (msg: string) => console.log(`[${routeName}] ${msg} (${elapsed()}s)`),
    error: (msg: string, err?: unknown) =>
      console.error(`[${routeName}] ${msg} (${elapsed()}s)`, err),
    start: (msg: string) => console.log(`[${routeName}] start ${msg}`),
    elapsed,
  };
};
