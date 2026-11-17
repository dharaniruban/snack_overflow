import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnacksSummary } from '@/src/hooks/useSnacksQuery';
import { getFriendlyErrorMessage } from '@/src/lib/errors';
import type { SnackStatus } from '@/src/types/api';

const HERO_LEFT_IMAGE = '/src/assets/images/snack_hero_spotlight_1794826279895.jpg';
const HERO_RIGHT_IMAGE = '/src/assets/images/pantry_login_hero_1794826279876.jpg';

export function DashboardPage() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrObj,
    refetch: refetchSummary,
  } = useSnacksSummary();

  const navigate = useNavigate();
  const [leftHeroFailed, setLeftHeroFailed] = useState(false);
  const [rightHeroFailed, setRightHeroFailed] = useState(false);

  const jumpToMenuStatus = (status: SnackStatus | '') => {
    navigate(status ? `/snacks?status=${status}` : '/snacks');
  };

  const counts = summary?.counts ?? { stocked: 0, runningLow: 0, gone: 0 };
  const totalSnacks = counts.stocked + counts.runningLow + counts.gone;
  const pantryHealthPct = totalSnacks > 0 ? Math.round((counts.stocked / totalSnacks) * 100) : 0;

  return (
    <div>
      {/* DIAGONAL SPLIT HERO BANNER (mirrors attached editorial reference) */}
      <section aria-label="Snack Overflow pantry showcase" className="relative w-full overflow-hidden border-b border-zinc-800 bg-[#141517]">
        {/* Mobile stacked view (<md) */}
        <div className="grid grid-cols-1 md:hidden">
          <div className="relative h-64 overflow-hidden">
            {!leftHeroFailed && (
              <img
                src={HERO_LEFT_IMAGE}
                alt="Curated artisan office snacks on dark slate"
                referrerPolicy="no-referrer"
                onError={() => setLeftHeroFailed(true)}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/40 to-zinc-950/25" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <h1 className="font-serif text-4xl font-semibold italic tracking-tight text-white">
                Snack Overflow
              </h1>
              <p className="mt-1.5 text-[10px] font-semibold tracking-[0.28em] text-[#d4b97e] uppercase">
                Office Pantry Collective
              </p>
            </div>
          </div>

          <div className="relative h-56 overflow-hidden border-t border-zinc-800">
            {!rightHeroFailed && (
              <img
                src={HERO_RIGHT_IMAGE}
                alt="Sunlit curated office pantry shelves"
                referrerPolicy="no-referrer"
                onError={() => setRightHeroFailed(true)}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-zinc-950/35" />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="border-2 border-white/95 bg-zinc-950/30 px-6 py-4 text-center backdrop-blur-[2px]">
                <p className="font-sans text-2xl font-bold tracking-[0.26em] text-white uppercase">
                  PANTRY
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-white/90 uppercase">
                  Live Stock &amp; Voting
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop diagonal split (md+) */}
        <div className="relative hidden h-[420px] w-full overflow-hidden md:block lg:h-[480px]">
          {/* Left Diagonal Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="hero-split-left absolute inset-0"
          >
            {!leftHeroFailed && (
              <img
                src={HERO_LEFT_IMAGE}
                alt="Curated artisan office snacks on dark slate"
                referrerPolicy="no-referrer"
                onError={() => setLeftHeroFailed(true)}
                className="h-full w-full object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/75 via-zinc-950/45 to-zinc-950/25" />
            <div className="absolute inset-y-0 left-0 flex w-[48%] flex-col items-center justify-center px-8 text-center">
              <h1 className="font-serif text-5xl font-semibold italic tracking-tight text-white drop-shadow-md lg:text-6xl">
                Snack Overflow
              </h1>
              <p className="mt-2.5 text-[11px] font-semibold tracking-[0.3em] text-zinc-100/90 uppercase">
                Office Pantry Collective
              </p>
            </div>
          </motion.div>

          {/* Right Diagonal Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="hero-split-right absolute inset-0"
          >
            {!rightHeroFailed && (
              <img
                src={HERO_RIGHT_IMAGE}
                alt="Sunlit curated office pantry shelves"
                referrerPolicy="no-referrer"
                onError={() => setRightHeroFailed(true)}
                className="h-full w-full object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-zinc-950/25" />
            <div className="absolute inset-y-0 right-0 flex w-[48%] items-center justify-center px-8">
              <button
                type="button"
                onClick={() => jumpToMenuStatus('')}
                className="group border-[3px] border-white/95 bg-zinc-950/25 px-8 py-5 text-center backdrop-blur-[2px] transition-all duration-200 hover:bg-zinc-950/45 active:scale-[0.99]"
              >
                <span className="block font-sans text-3xl font-bold tracking-[0.28em] text-white uppercase lg:text-4xl">
                  PANTRY
                </span>
                <span className="mt-1.5 block text-[11px] font-semibold tracking-[0.24em] text-white/90 uppercase group-hover:text-[#d4b97e]">
                  Live Stock &amp; Voting
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BRUSHED CHARCOAL PANTRY HEALTH SUMMARY STRIP */}
      <section aria-label="Pantry health summary" className="charcoal-bar border-b border-zinc-800/90">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {summaryError ? (
            <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200 sm:flex-row">
              <span>{getFriendlyErrorMessage(summaryErrObj)}</span>
              <button
                type="button"
                onClick={() => void refetchSummary()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4b97e] px-3 py-1.5 text-xs font-bold text-zinc-950 uppercase"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => jumpToMenuStatus('')}
                className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-left transition-colors hover:border-[#d4b97e]/60"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                  <span>Pantry Health</span>
                  <span className="font-mono text-[#d4b97e] tabular-nums">
                    {counts.stocked}/{totalSnacks}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-white">
                  {summaryLoading ? '—' : `${pantryHealthPct}%`}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-[#d4b97e] transition-[width] duration-300"
                    style={{ width: `${pantryHealthPct}%` }}
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => jumpToMenuStatus('stocked')}
                className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-left transition-colors hover:border-emerald-500/60"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                  <span>Stocked</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                </div>
                <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-white">
                  {summaryLoading ? '—' : counts.stocked}
                </p>
                <p className="mt-1 text-[11px] font-medium text-emerald-400">Ready to grab</p>
              </button>

              <button
                type="button"
                onClick={() => jumpToMenuStatus('running_low')}
                className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-left transition-colors hover:border-amber-500/60"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                  <span>Running Low</span>
                  <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                </div>
                <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-white">
                  {summaryLoading ? '—' : counts.runningLow}
                </p>
                <p className="mt-1 text-[11px] font-medium text-amber-400">Needs restock soon</p>
              </button>

              <button
                type="button"
                onClick={() => jumpToMenuStatus('gone')}
                className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-left transition-colors hover:border-red-500/60"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                  <span>Gone</span>
                  <XCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
                </div>
                <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-white">
                  {summaryLoading ? '—' : counts.gone}
                </p>
                <p className="mt-1 text-[11px] font-medium text-red-400">Out of stock</p>
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
