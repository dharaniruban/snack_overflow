import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { snackController } from './controller';
import { voteController } from '../votes/controller';
import {
  amountSchema,
  createSnackSchema,
  listSnacksQuerySchema,
  snackIdParamSchema,
  updateSnackSchema,
} from './schemas';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: listSnacksQuerySchema }), snackController.list);
// Summary must be registered before /:id or 'summary' would be parsed as an id.
router.get('/summary', snackController.summary);
router.get('/:id', validate({ params: snackIdParamSchema }), snackController.getById);

router.post('/', requireRole('admin'), validate({ body: createSnackSchema }), snackController.create);
router.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: snackIdParamSchema, body: updateSnackSchema }),
  snackController.update,
);
router.delete('/:id', requireRole('admin'), validate({ params: snackIdParamSchema }), snackController.remove);

router.post('/:id/consume', validate({ params: snackIdParamSchema, body: amountSchema }), snackController.consume);
router.post(
  '/:id/restock',
  requireRole('admin'),
  validate({ params: snackIdParamSchema, body: amountSchema }),
  snackController.restock,
);

router.post('/:id/vote', validate({ params: snackIdParamSchema }), voteController.vote);
router.delete('/:id/vote', validate({ params: snackIdParamSchema }), voteController.unvote);

export default router;
