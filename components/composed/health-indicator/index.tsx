import { type FC, useState } from 'react';

import { Z_INDEX } from '@/constants/z-index';
import { useHealth } from '@/hooks/domain/use-health';

type HealthState = 'healthy' | 'degraded' | 'unhealthy' | 'loading';

const getHealthState = (healthy: boolean | undefined): HealthState => {
  if (healthy === undefined) return 'loading';
  return healthy ? 'healthy' : 'unhealthy';
};

const getOverallState = (
  enclave: HealthState,
  solver: HealthState
): HealthState => {
  if (enclave === 'loading' || solver === 'loading') return 'loading';
  if (enclave === 'unhealthy' || solver === 'unhealthy') return 'unhealthy';
  if (enclave === 'degraded' || solver === 'degraded') return 'degraded';
  return 'healthy';
};

const stateColors: Record<HealthState, string> = {
  healthy: 'var(--color-success)',
  degraded: 'var(--color-warning)',
  unhealthy: 'var(--color-error)',
  loading: 'var(--color-text-muted)',
};

const HealthIndicator: FC = () => {
  const { enclave, solver, isLoading } = useHealth();
  const [expanded, setExpanded] = useState(false);

  const enclaveState = isLoading ? 'loading' : getHealthState(enclave?.healthy);
  const solverState = isLoading ? 'loading' : getHealthState(solver?.healthy);
  const overallState = getOverallState(enclaveState, solverState);

  return (
    <div
      className="fixed bottom-4 left-4 flex flex-col gap-2"
      style={{ zIndex: Z_INDEX.HEALTH }}
    >
      {expanded ? (
        <div className="bg-surface-raised rounded-lg border border-surface-border p-3 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: stateColors[enclaveState] }}
            />
            <span className="text-text text-xs">Enclave</span>
            <span className="text-text-muted text-[11px] ml-auto">
              {enclaveState}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: stateColors[solverState] }}
            />
            <span className="text-text text-xs">Solver API</span>
            <span className="text-text-muted text-[11px] ml-auto">
              {solverState}
            </span>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={expanded}
        aria-label="System health status"
        className="flex items-center gap-2 bg-surface-raised rounded-lg border border-surface-border py-2 px-3 cursor-pointer hover:bg-surface-overlay transition-colors duration-200 focus-ring"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: stateColors[overallState],
            boxShadow: `0 0 6px ${stateColors[overallState]}`,
          }}
        />
        <span className="text-text text-xs font-medium">
          {overallState === 'loading'
            ? 'Checking...'
            : overallState === 'healthy'
              ? 'All Systems Operational'
              : overallState === 'degraded'
                ? 'Degraded Performance'
                : 'Service Disruption'}
        </span>
      </button>
    </div>
  );
};

export default HealthIndicator;
