import { Div, Span } from '@stylin.js/elements';
import { type FC, useState } from 'react';

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
  healthy: '#22c55e',
  degraded: '#eab308',
  unhealthy: '#ef4444',
  loading: '#6b7280',
};

const HealthIndicator: FC = () => {
  const { enclave, solver, isLoading } = useHealth();
  const [expanded, setExpanded] = useState(false);

  const enclaveState = isLoading ? 'loading' : getHealthState(enclave?.healthy);
  const solverState = isLoading ? 'loading' : getHealthState(solver?.healthy);
  const overallState = getOverallState(enclaveState, solverState);

  return (
    <Div
      position="fixed"
      bottom="1rem"
      left="1rem"
      zIndex={1000}
      display="flex"
      flexDirection="column"
      gap="0.5rem"
    >
      {expanded && (
        <Div
          bg="#1a1a1a"
          borderRadius="8px"
          border="1px solid #333"
          p="0.75rem"
          display="flex"
          flexDirection="column"
          gap="0.5rem"
          minWidth="180px"
        >
          <Div display="flex" alignItems="center" gap="0.5rem">
            <Div
              width="8px"
              height="8px"
              borderRadius="50%"
              bg={stateColors[enclaveState]}
            />
            <Span color="#fff" fontSize="12px">
              Enclave
            </Span>
            <Span color="#888" fontSize="11px" ml="auto">
              {enclaveState}
            </Span>
          </Div>

          <Div display="flex" alignItems="center" gap="0.5rem">
            <Div
              width="8px"
              height="8px"
              borderRadius="50%"
              bg={stateColors[solverState]}
            />
            <Span color="#fff" fontSize="12px">
              Solver API
            </Span>
            <Span color="#888" fontSize="11px" ml="auto">
              {solverState}
            </Span>
          </Div>
        </Div>
      )}

      <Div
        display="flex"
        alignItems="center"
        gap="0.5rem"
        bg="#1a1a1a"
        borderRadius="8px"
        border="1px solid #333"
        p="0.5rem 0.75rem"
        cursor="pointer"
        nHover={{ bg: '#252525' }}
        transition="background 0.2s"
        onClick={() => setExpanded(!expanded)}
      >
        <Div
          width="8px"
          height="8px"
          borderRadius="50%"
          bg={stateColors[overallState]}
          boxShadow={`0 0 6px ${stateColors[overallState]}`}
        />
        <Span color="#fff" fontSize="12px" fontWeight="500">
          {overallState === 'loading'
            ? 'Checking...'
            : overallState === 'healthy'
              ? 'All Systems Operational'
              : overallState === 'degraded'
                ? 'Degraded Performance'
                : 'Service Disruption'}
        </Span>
      </Div>
    </Div>
  );
};

export default HealthIndicator;
