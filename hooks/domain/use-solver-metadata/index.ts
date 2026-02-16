import { useQuery } from '@tanstack/react-query';

import { fetchMetadata, type SolverMetadata } from '@/lib/solver/client';

const SOLVER_METADATA_STALE_TIME = 300_000;

export const useSolverMetadata = () => {
  const { data, isLoading, error } = useQuery<SolverMetadata>({
    queryKey: ['solverMetadata'],
    queryFn: () => fetchMetadata(),
    staleTime: SOLVER_METADATA_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  return { metadata: data, isLoading, error };
};

export default useSolverMetadata;
