import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/src/context/ToastContext';
import { snackKeys } from '@/src/hooks/useSnacksQuery';
import { api, createIdempotencyKey } from '@/src/lib/api';
import { triggerVoteConfetti } from '@/src/lib/confetti';
import { ApiError, getFriendlyErrorMessage } from '@/src/lib/errors';
import type {
  CreateSnackInput,
  Snack,
  SnacksListResponse,
  SnacksSummaryResponse,
  UpdateSnackInput,
} from '@/src/types/api';

interface VoteMutationVariables {
  snack: Snack;
  anchorEl?: HTMLElement | null;
}

type ListCacheSnapshot = Array<[readonly unknown[], SnacksListResponse | undefined]>;

export function useVoteMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ snack }: VoteMutationVariables) => {
      if (snack.hasVoted) {
        await api.snacks.unvote(snack.id);
        return { voted: false, updatedSnack: null as Snack | null };
      }
      const updatedSnack = await api.snacks.vote(snack.id);
      return { voted: true, updatedSnack };
    },
    onMutate: async ({ snack }) => {
      await queryClient.cancelQueries({ queryKey: snackKeys.all });

      const previousLists: ListCacheSnapshot = queryClient.getQueriesData<SnacksListResponse>({
        queryKey: snackKeys.lists(),
      });
      const previousSummary = queryClient.getQueryData<SnacksSummaryResponse>(snackKeys.summary());

      const nextHasVoted = !snack.hasVoted;
      const delta = nextHasVoted ? 1 : -1;

      queryClient.setQueriesData<SnacksListResponse>(
        { queryKey: snackKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === snack.id
                ? {
                    ...item,
                    hasVoted: nextHasVoted,
                    voteCount: Math.max(0, item.voteCount + delta),
                  }
                : item
            ),
          };
        }
      );

      if (previousSummary?.snackOfTheWeek && previousSummary.snackOfTheWeek.id === snack.id) {
        queryClient.setQueryData<SnacksSummaryResponse>(snackKeys.summary(), {
          ...previousSummary,
          snackOfTheWeek: {
            ...previousSummary.snackOfTheWeek,
            hasVoted: nextHasVoted,
            voteCount: Math.max(0, previousSummary.snackOfTheWeek.voteCount + delta),
          },
        });
      }

      return { previousLists, previousSummary };
    },
    onError: (error, _variables, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousSummary !== undefined) {
        queryClient.setQueryData(snackKeys.summary(), context.previousSummary);
      }

      showToast(getFriendlyErrorMessage(error, 'Could not update your vote.'), 'error');
    },
    onSuccess: (result, variables) => {
      if (result.voted) {
        triggerVoteConfetti(variables.anchorEl);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: snackKeys.all });
    },
  });
}

export function useConsumeMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ snackId, amount }: { snackId: string; snackName: string; amount: number }) => {
      const idempotencyKey = createIdempotencyKey();
      return api.snacks.consume(snackId, amount, idempotencyKey);
    },
    onSuccess: (updatedSnack, variables) => {
      showToast(
        `Grabbed ${variables.amount} × ${updatedSnack.name}. ${updatedSnack.quantity} left.`,
        'success'
      );
      void queryClient.invalidateQueries({ queryKey: snackKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'INSUFFICIENT_STOCK') {
        showToast('Someone beat you to the last packet!', 'warning');
        void queryClient.invalidateQueries({ queryKey: snackKeys.all });
        return;
      }
      showToast(getFriendlyErrorMessage(error, 'Could not consume snack.'), 'error');
      void queryClient.invalidateQueries({ queryKey: snackKeys.all });
    },
  });
}

export function useRestockMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ snackId, amount }: { snackId: string; amount: number }) =>
      api.snacks.restock(snackId, amount),
    onSuccess: (updatedSnack, variables) => {
      showToast(
        `Restocked ${variables.amount} × ${updatedSnack.name}. Now ${updatedSnack.quantity} in pantry.`,
        'success'
      );
      void queryClient.invalidateQueries({ queryKey: snackKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
    onError: (error) => {
      showToast(getFriendlyErrorMessage(error, 'Failed to restock snack.'), 'error');
    },
  });
}

export function useCreateSnackMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: CreateSnackInput) => api.snacks.create(input),
    onSuccess: (created) => {
      showToast(`Added "${created.name}" to the pantry.`, 'success');
      void queryClient.invalidateQueries({ queryKey: snackKeys.all });
    },
    onError: (error) => {
      showToast(getFriendlyErrorMessage(error, 'Failed to add snack.'), 'error');
    },
  });
}

export function useUpdateSnackMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSnackInput }) =>
      api.snacks.update(id, input),
    onSuccess: (updated) => {
      showToast(`Updated "${updated.name}".`, 'success');
      void queryClient.invalidateQueries({ queryKey: snackKeys.all });
    },
    onError: (error) => {
      showToast(getFriendlyErrorMessage(error, 'Failed to update snack.'), 'error');
    },
  });
}

export function useDeleteSnackMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => api.snacks.remove(id),
    onSuccess: (_data, variables) => {
      showToast(`Removed "${variables.name}" from the pantry.`, 'info');
      void queryClient.invalidateQueries({ queryKey: snackKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
    onError: (error) => {
      showToast(getFriendlyErrorMessage(error, 'Failed to delete snack.'), 'error');
    },
  });
}
