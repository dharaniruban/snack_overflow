import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { getApiBaseUrl } from '@/src/lib/api';

export function useSnackEvents(): void {
  const { token, isLiveSession } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLiveSession || !token) {
      return;
    }

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/events?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    const handleSnackEvent = () => {
      void queryClient.invalidateQueries({ queryKey: ['snacks'] });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    };

    eventSource.addEventListener('snack', handleSnackEvent);
    eventSource.onmessage = handleSnackEvent;

    return () => {
      eventSource.removeEventListener('snack', handleSnackEvent);
      eventSource.close();
    };
  }, [isLiveSession, token, queryClient]);
}
