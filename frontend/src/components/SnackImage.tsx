import { Coffee, Cookie, Flame, Leaf } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { formatCategoryLabel } from '@/src/lib/snackDisplay';
import {
  resolveSnackPlaceholder,
  SNACK_ILLUSTRATIONS,
  type SnackIllustrationKey,
} from '@/src/lib/snackPlaceholders';
import type { SnackCategory } from '@/src/types/api';

const FALLBACK_STYLES: Record<
  SnackIllustrationKey,
  { gradient: string; Icon: typeof Cookie }
> = {
  sweet: {
    gradient:
      'from-amber-100 via-stone-100 to-amber-50 dark:from-amber-950/70 dark:via-slate-900 dark:to-slate-950',
    Icon: Cookie,
  },
  savoury: {
    gradient:
      'from-yellow-100 via-stone-100 to-slate-100 dark:from-yellow-950/60 dark:via-slate-900 dark:to-slate-950',
    Icon: Flame,
  },
  drink: {
    gradient:
      'from-sky-100 via-slate-100 to-cyan-50 dark:from-sky-950/60 dark:via-slate-900 dark:to-slate-950',
    Icon: Coffee,
  },
  'healthy-ish': {
    gradient:
      'from-emerald-100 via-stone-100 to-teal-50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-slate-950',
    Icon: Leaf,
  },
  'tea-biscuit': {
    gradient:
      'from-emerald-100 via-stone-100 to-amber-50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-slate-950',
    Icon: Coffee,
  },
};

export function getSnackImageUrl(
  category: SnackCategory,
  name = '',
  imageUrl?: string
): string {
  return resolveSnackPlaceholder({ name, category, imageUrl }).src;
}

interface SnackImageProps {
  name: string;
  category: SnackCategory;
  imageUrl?: string;
  className?: string;
  imgClassName?: string;
  iconSizeClass?: string;
}

export function SnackImage({
  name,
  category,
  imageUrl,
  className = '',
  imgClassName = '',
  iconSizeClass = 'h-7 w-7',
}: SnackImageProps) {
  const resolved = resolveSnackPlaceholder({ name, category, imageUrl });
  const fallbackSrc = SNACK_ILLUSTRATIONS[resolved.key];
  const [activeSrc, setActiveSrc] = useState(resolved.src);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setActiveSrc(resolved.src);
    setLoadState('loading');
  }, [resolved.src]);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoadState('loaded');
    }
  }, [activeSrc]);

  const { gradient, Icon } = FALLBACK_STYLES[resolved.key] ?? FALLBACK_STYLES.savoury;

  const handleError = () => {
    if (activeSrc !== fallbackSrc) {
      setActiveSrc(fallbackSrc);
      setLoadState('loading');
      return;
    }
    setLoadState('error');
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      {loadState === 'loading' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-800/70"
        />
      )}

      {loadState !== 'error' ? (
        <motion.img
          ref={imgRef}
          src={activeSrc}
          alt={`${name} (${formatCategoryLabel(category)})`}
          referrerPolicy="no-referrer"
          loading="lazy"
          initial={{ opacity: 0 }}
          animate={{ opacity: loadState === 'loaded' ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onLoad={() => setLoadState('loaded')}
          onError={handleError}
          className={`h-full w-full object-cover transition-transform duration-300 ${imgClassName}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
          <Icon className={iconSizeClass} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
