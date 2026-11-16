import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { activityController } from './controller';
import { listActivityQuerySchema } from './schemas';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), validate({ query: listActivityQuerySchema }), activityController.list);

export default router;
