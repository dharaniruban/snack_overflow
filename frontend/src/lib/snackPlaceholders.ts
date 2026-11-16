import type { SnackCategory } from '@/src/types/api';

export type SnackIllustrationKey = SnackCategory | 'tea-biscuit';

export interface SnackPlaceholderAsset {
  src: string;
  key: SnackIllustrationKey;
  isPlaceholder: boolean;
}

export const SNACK_ILLUSTRATIONS: Record<SnackIllustrationKey, string> = {
  sweet: '/src/assets/images/illus_snack_sweet_1794829605634.jpg',
  savoury: '/src/assets/images/illus_snack_savoury_1794829605980.jpg',
  drink: '/src/assets/images/illus_snack_drink_1794829606387.jpg',
  'healthy-ish': '/src/assets/images/illus_snack_healthy_1794829606361.jpg',
  'tea-biscuit': '/src/assets/images/illus_snack_matcha_tea_1794829607373.jpg',
};

const KEYWORD_MATCHERS: ReadonlyArray<{ pattern: RegExp; key: SnackIllustrationKey }> = [
  { pattern: /\b(matcha|tea|chai|wafer|biscuit|shortbread|earl grey)\b/i, key: 'tea-biscuit' },
  { pattern: /\b(cookie|chocolate|cacao|caramel|brownie|candy|gummy|bar|donut|muffin)\b/i, key: 'sweet' },
  { pattern: /\b(chip|crisp|pretzel|cracker|popcorn|nacho|cheese|puff|tortilla)\b/i, key: 'savoury' },
  { pattern: /\b(soda|cold brew|coffee|sparkling|water|juice|cola|kombucha|latte|espresso|drink)\b/i, key: 'drink' },
  { pattern: /\b(almond|cashew|pistachio|nut|berry|berries|granola|oat|fruit|trail|seed|yogurt)\b/i, key: 'healthy-ish' },
];

export function resolveSnackPlaceholder(snack: {
  name: string;
  category: SnackCategory;
  imageUrl?: string;
}): SnackPlaceholderAsset {
  if (snack.imageUrl && snack.imageUrl.trim() !== '') {
    return {
      src: snack.imageUrl,
      key: snack.category,
      isPlaceholder: false,
    };
  }

  for (const matcher of KEYWORD_MATCHERS) {
    if (matcher.pattern.test(snack.name)) {
      return {
        src: SNACK_ILLUSTRATIONS[matcher.key],
        key: matcher.key,
        isPlaceholder: true,
      };
    }
  }

  const fallbackKey: SnackIllustrationKey = SNACK_ILLUSTRATIONS[snack.category]
    ? snack.category
    : 'savoury';

  return {
    src: SNACK_ILLUSTRATIONS[fallbackKey],
    key: fallbackKey,
    isPlaceholder: true,
  };
}
