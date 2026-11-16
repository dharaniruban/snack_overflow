import type { Snack, SnackCategory } from './types';

const CATEGORY_EMOJI: Record<SnackCategory, string> = {
  sweet: '🍬',
  savoury: '🥨',
  drink: '🥤',
  'healthy-ish': '🥗',
};

const CATEGORY_GRADIENT: Record<SnackCategory, string> = {
  sweet: 'from-pink-400 via-rose-400 to-orange-300',
  savoury: 'from-amber-400 via-orange-400 to-yellow-300',
  drink: 'from-sky-400 via-cyan-400 to-teal-300',
  'healthy-ish': 'from-lime-400 via-emerald-400 to-green-300',
};

// Heuristic emoji picker so each snack gets a recognizable "photo" without
// needing an image pipeline or external assets.
const NAME_RULES: Array<[RegExp, string]> = [
  [/peanut/i, '🥜'],
  [/cashew/i, '🥜'],
  [/chocolate|choc/i, '🍫'],
  [/cookie|oatmeal|granola/i, '🍪'],
  [/popcorn/i, '🍿'],
  [/mixturen|candy|sweet|ladoo|jalebi/i, '🍬'],
  [/chai|latte|coffee/i, '☕'],
  [/tea(?!a)/i, '🍵'],
  [/cola|soda|drink/i, '🥤'],
  [/hummus/i, '🥣'],
  [/chana|edamame|nut/i, '🫘'],
  [/cracker|chip|fries/i, '🍟'],
  [/cheese/i, '🧀'],
  [/fruit|berry/i, '🍇'],
];

export function snackEmoji(snack: Pick<Snack, 'name' | 'category'>): string {
  for (const [pattern, emoji] of NAME_RULES) {
    if (pattern.test(snack.name)) return emoji;
  }
  return CATEGORY_EMOJI[snack.category];
}

export function categoryGradient(category: SnackCategory): string {
  return CATEGORY_GRADIENT[category];
}
