import { useQuery } from '@tanstack/react-query';

import type { CombinedHealthResponse } from '@/app/api/health/route';
import { REFETCH_INTERVALS } from '@/constants/refetch-intervals';

export interface HealthStatus {
  enclave: { healthy: boolean } | null;
  solver: { healthy: boolean } | null;
  isLoading: boolean;
}

const fetchHealth = async (): Promise<CombinedHealthResponse> => {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
};

export const useHealth = (): HealthStatus => {
  const { data, isLoading } = useQuery<CombinedHealthResponse>({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: REFETCH_INTERVALS.HEALTH,
    refetchOnWindowFocus: false,
  });

  return {
    enclave: data?.enclave ?? null,
    solver: data?.solver ?? null,
    isLoading,
  };
};
