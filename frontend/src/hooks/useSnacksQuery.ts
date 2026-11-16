import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import type { SnackQueryParams } from '@/src/types/api';

export const snackKeys = {
  all: ['snacks'] as const,
  lists: () => ['snacks', 'list'] as const,
  list: (params: SnackQueryParams) => ['snacks', 'list', params] as const,
  summary: () => ['snacks', 'summary'] as const,
  detail: (id: string) => ['snacks', 'detail', id] as const,
  activity: (params: { page: number; pageSize: number }) => ['activity', params] as const,
};

export function useSnacksList(params: SnackQueryParams) {
  return useQuery({
    queryKey: snackKeys.list(params),
    queryFn: () => api.snacks.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSnacksSummary() {
  return useQuery({
    queryKey: snackKeys.summary(),
    queryFn: () => api.snacks.summary(),
  });
}

export function useActivityFeed(page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: snackKeys.activity({ page, pageSize }),
    queryFn: () => api.activity.list({ page, pageSize }),
    enabled,
    placeholderData: keepPreviousData,
  });
}
