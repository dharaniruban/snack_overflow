import { pool } from '../../db/pool';
import { AppError } from '../../utils/errors';
import { snackRepository } from '../snacks/repository';
import { snackService } from '../snacks/service';
import { emitSnackChanged } from '../../utils/events';
import { voteRepository } from './repository';

export const voteService = {
  async vote(snackId: string, userId: string) {
    const exists = await snackRepository.exists(pool, snackId);
    if (!exists) {
      throw new AppError('NOT_FOUND', 'Snack not found');
    }

    const inserted = await voteRepository.add(pool, { userId, snackId });
    if (!inserted) {
      throw new AppError('ALREADY_VOTED', 'You already voted for this snack');
    }

    emitSnackChanged('voted', snackId);
    return snackService.getById(snackId, userId);
  },

  async unvote(snackId: string, userId: string): Promise<void> {
    const removed = await voteRepository.remove(pool, { userId, snackId });
    if (!removed) {
      throw new AppError('NOT_FOUND', 'Vote not found');
    }
    emitSnackChanged('unvoted', snackId);
  },
};
