import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds until a query transitions to stale state
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Time in milliseconds that unused data will remain in cache
      gcTime: 1000 * 60 * 10, // 10 minutes

      // Number of times to retry a failed request
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
          return false;
        }
        return failureCount < 3;
      },

      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,

      // Error handling
      onError: (error) => {
        console.error('Mutation failed:', error);
      },
    },
  },
});

// Query keys for consistency
export const queryKeys = {
  // Authentication
  auth: ['auth'] as const,
  user: ['user'] as const,

  // Time entries
  timeEntries: ['timeEntries'] as const,
  timeEntry: (id: string) => ['timeEntry', id] as const,
  timeEntriesList: (params?: Record<string, any>) => ['timeEntries', 'list', params] as const,
  timeEntryStats: (days?: number) => ['timeEntries', 'stats', days] as const,

  // Daily plans
  dailyPlans: ['dailyPlans'] as const,
  dailyPlan: (id: string) => ['dailyPlan', id] as const,
  dailyPlansList: (params?: Record<string, any>) => ['dailyPlans', 'list', params] as const,
  todayPlan: ['dailyPlans', 'today'] as const,
  dailyPlanStats: (days?: number) => ['dailyPlans', 'stats', days] as const,

  // Statistics
  statisticsOverview: (params?: Record<string, any>) => ['statistics', 'overview', params] as const,
  statisticsProductivity: (days?: number) => ['statistics', 'productivity', days] as const,
  statisticsCategories: (params?: Record<string, any>) => ['statistics', 'categories', params] as const,
  statisticsTimeseries: (params?: Record<string, any>) => ['statistics', 'timeseries', params] as const,
  statisticsInsights: (days?: number) => ['statistics', 'insights', days] as const,
} as const;

// Query options factory functions
export const createQueryOptions = (queryKey: any[], queryFn: any, options?: any) => ({
  queryKey,
  queryFn,
  ...options,
});

// Mutation options factory functions
export const createMutationOptions = <TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  }
) => ({
  mutationFn,
  onSuccess: (data: TData, variables: TVariables) => {
    // Invalidate relevant queries
    if (options.onSuccess) {
      options.onSuccess(data, variables);
    }
  },
  onError: options.onError,
  onSettled: options.onSettled,
});

// Error handling utilities
export const handleQueryError = (error: unknown) => {
  if (error instanceof Error) {
    console.error('Query error:', error.message);
    // You could add error reporting here
    return error.message;
  }
  return 'An unknown error occurred';
};

// Loading utilities
export const createLoadingState = (isLoading: boolean, error?: unknown) => ({
  isLoading,
  isError: !!error,
  error: error ? handleQueryError(error) : null,
});

// Refetch utilities
export const refetchQueries = async (queryKeys: string[][]) => {
  await Promise.all(
    queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
  );
};