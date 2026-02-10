import useSWR from 'swr';

import type { EnclaveHealthResponse } from '@/pages/api/health/enclave';
import type { SolverHealthResponse } from '@/pages/api/health/solver';

export interface HealthStatus {
  enclave: EnclaveHealthResponse | null;
  solver: SolverHealthResponse | null;
  isLoading: boolean;
}

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  return response.json();
};

export const useHealth = (): HealthStatus => {
  const { data: enclave, isLoading: enclaveLoading } =
    useSWR<EnclaveHealthResponse>('/api/health/enclave', fetcher, {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    });

  const { data: solver, isLoading: solverLoading } =
    useSWR<SolverHealthResponse>('/api/health/solver', fetcher, {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    });

  return {
    enclave: enclave ?? null,
    solver: solver ?? null,
    isLoading: enclaveLoading || solverLoading,
  };
};
