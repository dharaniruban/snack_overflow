import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuthUser } from '../../middleware/authUser';
import { authService } from './service';
import type { registerSchema } from './schemas';
import type { z } from 'zod';

type RegisterBody = z.infer<typeof registerSchema>;

export const authController = {
  me: (req: Request, res: Response) => {
    res.status(200).json(requireAuthUser(req));
  },

  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body as RegisterBody;
    const user = await authService.register(name, email, password);
    res.status(201).json(user);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    res.status(200).json(result);
  }),
};
