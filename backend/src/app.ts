import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOrigins } from './config/env';
import authRoutes from './modules/auth/routes';
import activityRoutes from './modules/activity/routes';
import snackRoutes from './modules/snacks/routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // One proxy hop is expected in Docker/local dev; needed for correct client IPs
  // used by the login rate limiter.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.includes('*') ? true : corsOrigins,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use('/auth', authRoutes);
  app.use('/snacks', snackRoutes);
  app.use('/activity', activityRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
