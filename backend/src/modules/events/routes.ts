import { Router, type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { snackEvents, type SnackChangedEvent } from '../../utils/events';

const router = Router();

// EventSource cannot set Authorization headers, so the client passes the JWT
// as ?token=. Bridge it into the header so the standard requireAuth middleware
// (and its DB role re-check) protects this route like every other.
function tokenFromQuery(req: Request, _res: Response, next: NextFunction): void {
  const queryToken = req.query.token;
  if (
    typeof queryToken === 'string' &&
    queryToken.length > 0 &&
    !req.headers.authorization
  ) {
    req.headers.authorization = `Bearer ${queryToken}`;
  }
  next();
}

router.get('/', tokenFromQuery, requireAuth, (req, res) => {
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
