import { useEffect, useRef } from 'react';

/**
 * Subscribes to the backend SSE stream and calls `onEvent` whenever a snack
 * changes. EventSource cannot send Authorization headers, so the short-lived
 * JWT is passed as a query parameter (the endpoint accepts it only there).
 */
export function useSnackEvents(token: string | null, onEvent: () => void): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!token) return;
    const source = new EventSource(`/events?token=${encodeURIComponent(token)}`);
    source.onmessage = () => onEventRef.current();
    // EventSource reconnects automatically; errors are non-fatal.
    return () => source.close();
  }, [token]);
}
