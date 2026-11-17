import { Coffee, Cookie, Flame, Leaf } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { formatCategoryLabel } from '@/src/lib/snackDisplay';
import {
  resolveSnackPlaceholder,
  type SnackImageKey,
} from '@/src/lib/snackPlaceholders';
import type { SnackCategory } from '@/src/types/api';

const FALLBACK_STYLES: Record<
  SnackImageKey,
  { gradient: string; Icon: typeof Cookie }
> = {
  sweet: {
    gradient:
      'from-amber-100 via-stone-100 to-amber-50 dark:from-amber-950/70 dark:via-zinc-900 dark:to-zinc-950',
    Icon: Cookie,
  },
  savoury: {
    gradient:
      'from-yellow-100 via-stone-100 to-zinc-100 dark:from-yellow-950/60 dark:via-zinc-900 dark:to-zinc-950',
    Icon: Flame,
  },
  drink: {
    gradient:
      'from-sky-100 via-slate-100 to-cyan-50 dark:from-sky-950/60 dark:via-zinc-900 dark:to-zinc-950',
    Icon: Coffee,
  },
  'healthy-ish': {
    gradient:
      'from-emerald-100 via-stone-100 to-teal-50 dark:from-emerald-950/60 dark:via-zinc-900 dark:to-zinc-950',
    Icon: Leaf,
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
  const hasCustomImage = Boolean(imageUrl && imageUrl.trim() !== '');
  const resolved = resolveSnackPlaceholder({
    name,
    category,
    imageUrl: hasCustomImage ? imageUrl : undefined,
  });
  const [activeSrc, setActiveSrc] = useState(hasCustomImage ? resolved.src : '');
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>(
    hasCustomImage ? 'loading' : 'error'
  );
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!hasCustomImage) {
      return;
    }
    setActiveSrc(resolved.src);
    setLoadState('loading');
  }, [resolved.src, hasCustomImage]);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoadState('loaded');
    }
  }, [activeSrc]);

  const { gradient, Icon } = FALLBACK_STYLES[resolved.key] ?? FALLBACK_STYLES.savoury;

  const handleError = () => {
    setLoadState('error');
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      {loadState === 'loading' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-stone-200/80 dark:bg-zinc-800/80"
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
        <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-500">
          <Icon className={iconSizeClass} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
