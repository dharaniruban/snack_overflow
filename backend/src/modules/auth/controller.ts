import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuthUser } from '../../middleware/authUser';
import { authService } from './service';

export const authController = {
  me: (req: Request, res: Response) => {
    res.status(200).json(requireAuthUser(req));
  },

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    res.status(200).json(result);
  }),
};
