import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { AppError } from '../../utils/errors';
import { authController } from './controller';
import { loginSchema, registerSchema } from './schemas';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('RATE_LIMITED', 'Too many attempts, please try again later'));
  },
});

router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  authController.register,
);
router.get('/me', requireAuth, authController.me);

export default router;
