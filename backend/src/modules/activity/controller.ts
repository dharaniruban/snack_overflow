import type { Request, Response } from 'express';
import type { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import type { listActivityQuerySchema } from './schemas';
import { activityService } from './service';

type ListQuery = z.infer<typeof listActivityQuerySchema>;

export const activityController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await activityService.list(req.query as unknown as ListQuery);
    res.status(200).json(result);
  }),
};
