import { Router, type Request } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { snackEvents, type SnackChangedEvent } from '../../utils/events';
import { userRepository } from '../auth/repository';

const router = Router();

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  const queryToken = req.query.token;
  return typeof queryToken === 'string' && queryToken.length > 0 ? queryToken : null;
}

router.get('/', async (req, res) => {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing bearer token' } });
    return;
  }

  let payload: { sub?: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
  } catch {
    res
      .status(401)
      .json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } });
    return;
  }

  const user = payload.sub ? await userRepository.findById(pool, payload.sub) : undefined;
  if (!user) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'User no longer exists' } });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    // Disable proxy buffering so events flush immediately.
    'X-Accel-Buffering': 'no',
  });
  res.write('event: ready\ndata: {}\n\n');

  const listener = (event: SnackChangedEvent) => {
    res.write(`event: snack\ndata: ${JSON.stringify(event)}\n\n`);
  };
  snackEvents.on('snack', listener);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    snackEvents.off('snack', listener);
    res.end();
  });
});

export default router;
