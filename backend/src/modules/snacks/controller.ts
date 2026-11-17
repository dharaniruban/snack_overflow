import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/errors';
import { requireAuthUser } from '../../middleware/authUser';
import { snackService } from './service';
import type {
  amountSchema,
  createSnackSchema,
  listSnacksQuerySchema,
  snackIdParamSchema,
  updateSnackSchema,
} from './schemas';
import type { z } from 'zod';

type IdParams = z.infer<typeof snackIdParamSchema>;
type ListQuery = z.infer<typeof listSnacksQuerySchema>;
type CreateBody = z.infer<typeof createSnackSchema>;
type UpdateBody = z.infer<typeof updateSnackSchema>;
type AmountBody = z.infer<typeof amountSchema>;

export const snackController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const result = await snackService.list(req.query as unknown as ListQuery, user.id);
    res.status(200).json(result);
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const result = await snackService.summary(user.id);
    res.status(200).json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const { id } = req.params as IdParams;
    const snack = await snackService.getById(id, user.id);
    res.status(200).json(snack);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const snack = await snackService.create(req.body as CreateBody, user.id);
    res.status(201).json(snack);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const { id } = req.params as IdParams;
    const snack = await snackService.update(id, req.body as UpdateBody, user.id);
    res.status(200).json(snack);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    await snackService.remove(id);
    res.status(204).end();
  }),

  consume: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const { id } = req.params as IdParams;
    const { amount } = req.body as AmountBody;
    const idempotencyKey = req.get('Idempotency-Key');
    if (idempotencyKey && idempotencyKey.length > 255) {
      throw new AppError('VALIDATION_ERROR', 'Idempotency-Key is too long');
    }
    const snack = await snackService.consume(id, amount, user, idempotencyKey ?? undefined);
    res.status(200).json(snack);
  }),

  restock: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const { id } = req.params as IdParams;
    const { amount } = req.body as AmountBody;
    const snack = await snackService.restock(id, amount, user);
    res.status(200).json(snack);
  }),
};
