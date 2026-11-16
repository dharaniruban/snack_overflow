import type { Request, Response } from 'express';
import type { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuthUser } from '../../middleware/authUser';
import type { snackIdParamSchema } from '../snacks/schemas';
import { voteService } from './service';

type IdParams = z.infer<typeof snackIdParamSchema>;

export const voteController = {
  vote: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const { id } = req.params as IdParams;
    const snack = await voteService.vote(id, user.id);
    res.status(200).json(snack);
  }),

  unvote: asyncHandler(async (req: Request, res: Response) => {
    const user = requireAuthUser(req);
    const { id } = req.params as IdParams;
    await voteService.unvote(id, user.id);
    res.status(204).end();
  }),
};
