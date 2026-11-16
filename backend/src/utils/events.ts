import { EventEmitter } from 'events';

export interface SnackChangedEvent {
  type: 'created' | 'updated' | 'deleted' | 'consumed' | 'restocked' | 'voted' | 'unvoted';
  snackId: string;
}

// In-process pub/sub for SSE. Single-instance only; see README for scaling notes.
export const snackEvents = new EventEmitter();
snackEvents.setMaxListeners(200);

export function emitSnackChanged(type: SnackChangedEvent['type'], snackId: string): void {
  snackEvents.emit('snack', { type, snackId } satisfies SnackChangedEvent);
}
