import { useQuery } from '@tanstack/react-query';

import type { EnclaveHealthResponse } from '@/app/api/health/enclave/route';
import type { SolverHealthResponse } from '@/app/api/health/solver/route';
import { REFETCH_INTERVALS } from '@/constants/refetch-intervals';

export interface HealthStatus {
  enclave: EnclaveHealthResponse | null;
  solver: SolverHealthResponse | null;
  isLoading: boolean;
}

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
};

export const useHealth = (): HealthStatus => {
  const { data: enclave, isLoading: enclaveLoading } =
    useQuery<EnclaveHealthResponse>({
      queryKey: ['health', 'enclave'],
      queryFn: () => fetcher<EnclaveHealthResponse>('/api/health/enclave'),
      refetchInterval: REFETCH_INTERVALS.HEALTH,
      refetchOnWindowFocus: false,
    });

  const { data: solver, isLoading: solverLoading } =
    useQuery<SolverHealthResponse>({
      queryKey: ['health', 'solver'],
      queryFn: () => fetcher<SolverHealthResponse>('/api/health/solver'),
      refetchInterval: REFETCH_INTERVALS.HEALTH,
      refetchOnWindowFocus: false,
    });

  return {
    enclave: enclave ?? null,
    solver: solver ?? null,
    isLoading: enclaveLoading || solverLoading,
  };
};
