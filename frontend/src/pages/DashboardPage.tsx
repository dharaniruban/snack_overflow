import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Heart,
  RefreshCw,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSnackImageUrl, SnackImage } from '@/src/components/SnackImage';
import { LastPacketBadge, SnackStatusBadge } from '@/src/components/SnackStatusBadge';
import { StockFuelGauge } from '@/src/components/StockFuelGauge';
import { useConsumeMutation, useVoteMutation } from '@/src/hooks/useSnackMutations';
import { useSnacksList, useSnacksSummary } from '@/src/hooks/useSnacksQuery';
import { getFriendlyErrorMessage } from '@/src/lib/errors';
import { formatCategoryLabel } from '@/src/lib/snackDisplay';

const HERO_SPOTLIGHT_IMAGE = '/src/assets/images/snack_hero_spotlight_1794826279895.jpg';

export function DashboardPage() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrObj,
    refetch: refetchSummary,
  } = useSnacksSummary();

  const { data: watchlistData, isLoading: watchlistLoading } = useSnacksList({
    page: 1,
    pageSize: 6,
    sort: 'quantity',
    order: 'asc',
  });

  const voteMutation = useVoteMutation();
  const consumeMutation = useConsumeMutation();
  const heroVoteBtnRef = useRef<HTMLButtonElement | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const counts = summary?.counts ?? { stocked: 0, runningLow: 0, gone: 0 };
  const totalSnacks = counts.stocked + counts.runningLow + counts.gone;
  const pantryHealthPct = totalSnacks > 0 ? Math.round((counts.stocked / totalSnacks) * 100) : 0;
  const snackOfTheWeek = summary?.snackOfTheWeek ?? null;
  const heroImageSrc = snackOfTheWeek
    ? getSnackImageUrl(snackOfTheWeek.category, snackOfTheWeek.name, snackOfTheWeek.imageUrl)
    : HERO_SPOTLIGHT_IMAGE;

  if (summaryError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900/60 dark:bg-zinc-900">
        <XCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
        <h2 className="mt-3 font-display text-lg font-bold text-zinc-950 dark:text-white">
          Unable to load pantry overview
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {getFriendlyErrorMessage(summaryErrObj)}
        </p>
        <button
          type="button"
          onClick={() => void refetchSummary()}
          className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 transition-all hover:bg-yellow-300 active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Focal Anchor: Snack of the Week */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="snack-of-week-heading"
      >
        {summaryLoading ? (
          <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-900" />
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 text-white dark:border-zinc-800">
            {!heroImgFailed && (
              <img
                src={heroImageSrc}
                alt={
                  snackOfTheWeek
                    ? `${snackOfTheWeek.name} — ${formatCategoryLabel(snackOfTheWeek.category)}`
                    : 'Curated office snacks arranged on dark slate'
                }
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="absolute inset-0 h-full w-full object-cover object-center opacity-75 transition-opacity duration-500"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/92 to-zinc-950/45" />

            <div className="relative z-10 flex flex-col justify-between gap-6 p-6 sm:p-8 lg:flex-row lg:items-end">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-yellow-400 uppercase">
                  <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Snack of the Week</span>
                </div>

                {snackOfTheWeek ? (
                  <>
                    <h1
                      id="snack-of-week-heading"
                      className="mt-2 font-display text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl"
                    >
                      {snackOfTheWeek.name}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-300">
                      <span>{formatCategoryLabel(snackOfTheWeek.category)}</span>
                      <span aria-hidden="true" className="mx-2">·</span>
                      <span className="font-mono tabular-nums">
                        {snackOfTheWeek.quantity} in pantry
                      </span>
                      <span aria-hidden="true" className="mx-2">·</span>
                      <span className="font-mono tabular-nums">
                        {snackOfTheWeek.voteCount} votes
                      </span>
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={snackOfTheWeek.quantity <= 0 || consumeMutation.isPending}
                        onClick={() =>
                          consumeMutation.mutate({
                            snackId: snackOfTheWeek.id,
                            snackName: snackOfTheWeek.name,
                            amount: 1,
                          })
                        }
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 shadow-[0_1px_0_0_rgba(255,255,255,0.45)_inset] transition-all duration-150 hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
                      >
                        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                        <span>
                          {snackOfTheWeek.quantity <= 0 ? 'Out of stock' : 'Grab one'}
                        </span>
                      </button>

                      <button
                        ref={heroVoteBtnRef}
                        type="button"
                        disabled={voteMutation.isPending}
                        onClick={() =>
                          voteMutation.mutate({
                            snack: snackOfTheWeek,
                            anchorEl: heroVoteBtnRef.current,
                          })
                        }
                        aria-pressed={snackOfTheWeek.hasVoted}
                        className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all duration-150 active:scale-[0.97] ${
                          snackOfTheWeek.hasVoted
                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30'
                            : 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            snackOfTheWeek.hasVoted ? 'fill-yellow-400 text-yellow-400' : ''
                          }`}
                          aria-hidden="true"
                        />
                        <span className="font-mono tabular-nums">
                          {snackOfTheWeek.hasVoted ? 'Voted' : 'Vote'} ({snackOfTheWeek.voteCount})
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h1
                      id="snack-of-week-heading"
                      className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
                    >
                      No Snack of the Week yet
                    </h1>
                    <p className="mt-2 text-sm text-zinc-300">
                      Upvote snacks in the pantry to crown this week’s office favorite.
                    </p>
                    <Link
                      to="/snacks"
                      className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 transition-all hover:bg-yellow-300 active:scale-[0.98]"
                    >
                      <span>Browse pantry</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </>
                )}
              </div>

              {snackOfTheWeek && (
                <div className="flex items-center gap-2">
                  <SnackStatusBadge status={snackOfTheWeek.status} />
                  {snackOfTheWeek.quantity === 1 && <LastPacketBadge />}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.section>

      {/* 4-Column KPI Strip */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Pantry health summary"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pantry Health % */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>Pantry health</span>
              <span className="font-mono tabular-nums">
                {counts.stocked}/{totalSnacks} stocked
              </span>
            </div>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-zinc-950 dark:text-white">
              {summaryLoading ? '—' : `${pantryHealthPct}%`}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-yellow-400 transition-[width] duration-300"
                style={{ width: `${pantryHealthPct}%` }}
              />
            </div>
          </div>

          {/* Stocked */}
          <Link
            to="/snacks?status=stocked"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-yellow-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-yellow-400/70"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Stocked
              </span>
              <CheckCircle2
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-zinc-950 dark:text-white">
              {summaryLoading ? '—' : counts.stocked}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 group-hover:text-yellow-600 dark:text-zinc-300 dark:group-hover:text-yellow-400">
              <span>View stocked</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </p>
          </Link>

          {/* Running Low */}
          <Link
            to="/snacks?status=running_low"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500/70"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Running low
              </span>
              <AlertTriangle
                className="h-4 w-4 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-zinc-950 dark:text-white">
              {summaryLoading ? '—' : counts.runningLow}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:underline dark:text-amber-400">
              <span>Inspect low stock</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </p>
          </Link>

          {/* Gone */}
          <Link
            to="/snacks?status=gone"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-red-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-500/70"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Gone</span>
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-zinc-950 dark:text-white">
              {summaryLoading ? '—' : counts.gone}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 group-hover:underline dark:text-red-400">
              <span>View empty</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </p>
          </Link>
        </div>
      </motion.section>

      {/* Low Stock & Quick Access Watchlist */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="watchlist-heading"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="watchlist-heading"
              className="font-display text-xl font-bold text-zinc-950 dark:text-white"
            >
              Lowest stock first
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Snacks closest to running out across the office pantry.
            </p>
          </div>
          <Link
            to="/snacks"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-900 whitespace-nowrap transition-all hover:border-yellow-400 hover:bg-yellow-400 hover:text-zinc-950 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-zinc-950"
          >
            <span>Open full pantry</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4">
          {watchlistLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-44 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                />
              ))}
            </div>
          ) : watchlistData && watchlistData.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {watchlistData.data.map((snack, index) => (
                <motion.div
                  key={snack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(index * 0.04, 0.2),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3.5 p-4 pb-3">
                    <SnackImage
                      name={snack.name}
                      category={snack.category}
                      imageUrl={snack.imageUrl}
                      className="h-14 w-16 shrink-0 rounded-xl border border-zinc-100 dark:border-zinc-800"
                      iconSizeClass="h-5 w-5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatCategoryLabel(snack.category)}
                        </p>
                        <SnackStatusBadge status={snack.status} />
                      </div>
                      <h3 className="mt-0.5 truncate font-bold text-zinc-950 dark:text-zinc-100">
                        {snack.name}
                      </h3>
                      {snack.quantity === 1 && (
                        <div className="mt-1.5">
                          <LastPacketBadge />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <StockFuelGauge
                      quantity={snack.quantity}
                      lowStockThreshold={snack.lowStockThreshold}
                      status={snack.status}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No snacks tracked yet. Head to the pantry to add items.
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
