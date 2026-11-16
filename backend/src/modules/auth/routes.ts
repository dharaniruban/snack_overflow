import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { AppError } from '../../utils/errors';
import { authController } from './controller';
import { loginSchema } from './schemas';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('RATE_LIMITED', 'Too many login attempts, please try again later'));
  },
});

router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', requireAuth, authController.me);

export default router;
