import type { SnackCategory } from '@/src/types/api';

export type SnackImageKey = SnackCategory;

type SnackItemImageKey =
  | 'potato_chips'
  | 'pretzels'
  | 'popcorn'
  | 'cookies'
  | 'chocolate_bar'
  | 'iced_coffee'
  | 'sparkling_water'
  | 'green_tea'
  | 'almonds'
  | 'granola_bar';

export interface SnackPlaceholderAsset {
  src: string;
  key: SnackImageKey;
  isPlaceholder: boolean;
}

export const SNACK_REAL_IMAGES: Record<SnackImageKey, string> = {
  sweet: '/src/assets/images/snack_sweet_artisan_1794829395733.jpg',
  savoury: '/src/assets/images/snack_savoury_crisps_1794829395933.jpg',
  drink: '/src/assets/images/snack_drink_craft_1794829396196.jpg',
  'healthy-ish': '/src/assets/images/snack_healthy_nuts_1794829397016.jpg',
};

export const SNACK_ITEM_IMAGES: Record<SnackItemImageKey, { src: string; category: SnackImageKey }> = {
  potato_chips: {
    src: '/src/assets/images/snack_savoury_crisps_1794829395933.jpg',
    category: 'savoury',
  },
  pretzels: {
    src: '/src/assets/images/snack_pretzels_1794902612998.jpg',
    category: 'savoury',
  },
  popcorn: {
    src: '/src/assets/images/snack_popcorn_1794902614894.jpg',
    category: 'savoury',
  },
  cookies: {
    src: '/src/assets/images/snack_sweet_artisan_1794829395733.jpg',
    category: 'sweet',
  },
  chocolate_bar: {
    src: '/src/assets/images/snack_chocolate_bar_1794902614897.jpg',
    category: 'sweet',
  },
  iced_coffee: {
    src: '/src/assets/images/snack_drink_craft_1794829396196.jpg',
    category: 'drink',
  },
  sparkling_water: {
    src: '/src/assets/images/snack_sparkling_water_1794902614831.jpg',
    category: 'drink',
  },
  green_tea: {
    src: '/src/assets/images/snack_green_tea_1794902615358.jpg',
    category: 'drink',
  },
  almonds: {
    src: '/src/assets/images/snack_healthy_nuts_1794829397016.jpg',
    category: 'healthy-ish',
  },
  granola_bar: {
    src: '/src/assets/images/snack_granola_bar_1794902615711.jpg',
    category: 'healthy-ish',
  },
};

const KEYWORD_MATCHERS: ReadonlyArray<{ pattern: RegExp; itemKey: SnackItemImageKey }> = [
  { pattern: /\b(pretzel|pretzels)\b/i, itemKey: 'pretzels' },
  { pattern: /\b(popcorn|corn)\b/i, itemKey: 'popcorn' },
  { pattern: /\b(chip|chips|crisp|crisps|nacho|tortilla)\b/i, itemKey: 'potato_chips' },
  { pattern: /\b(chocolate bar|cocoa|dark chocolate|milk chocolate|fudge)\b/i, itemKey: 'chocolate_bar' },
  { pattern: /\b(cookie|cookies|biscuit|wafer|brownie|cake)\b/i, itemKey: 'cookies' },
  { pattern: /\b(sparkling|water|seltzer|soda|lime|lemonade|juice)\b/i, itemKey: 'sparkling_water' },
  { pattern: /\b(tea|green tea|matcha|mint|chai)\b/i, itemKey: 'green_tea' },
  { pattern: /\b(coffee|cold brew|espresso|latte|mocha)\b/i, itemKey: 'iced_coffee' },
  { pattern: /\b(granola|oat|oats|bar|muesli|trail)\b/i, itemKey: 'granola_bar' },
  { pattern: /\b(almond|almonds|nut|nuts|cashew|pistachio|peanut|berry|berries)\b/i, itemKey: 'almonds' },
];

export function resolveSnackPlaceholder(snack: {
  name: string;
  category: SnackCategory;
  imageUrl?: string;
}): SnackPlaceholderAsset {
  const categoryKey: SnackImageKey = SNACK_REAL_IMAGES[snack.category]
    ? snack.category
    : 'savoury';

  if (snack.imageUrl && snack.imageUrl.trim() !== '') {
    return {
      src: snack.imageUrl,
      key: categoryKey,
      isPlaceholder: false,
    };
  }

  for (const matcher of KEYWORD_MATCHERS) {
    if (matcher.pattern.test(snack.name)) {
      const matched = SNACK_ITEM_IMAGES[matcher.itemKey];
      return {
        src: matched.src,
        key: matched.category,
        isPlaceholder: true,
      };
    }
  }

  return {
    src: SNACK_REAL_IMAGES[categoryKey],
    key: categoryKey,
    isPlaceholder: true,
  };
}
