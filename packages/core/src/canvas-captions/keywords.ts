/**
 * Trigger words {@link keywordEmphasis} picks out by default: words short
 * videos lean on to make a claim land. English only; pass your own list for
 * other languages.
 *
 * @public
 */
export const KEYWORDS: readonly string[] = [
  // amounts in words ("one" is left out: "this one trick")
  "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "twenty", "fifty", "hundred", "hundreds", "thousand", "thousands", "million", "millions",
  "billion", "billions", "trillion", "half", "double", "doubled", "triple", "tripled", "zero",
  // claims and contrasts
  "never", "always", "every", "everything", "nothing", "everyone", "nobody",
  "only", "best", "worst", "biggest", "fastest", "first", "last", "free",
  "secret", "insane", "crazy", "huge", "massive", "instantly", "guaranteed",
  "stop", "mistake", "wrong", "money", "rich", "broke", "viral",
];

// a digit anywhere (10, $10,000, 50%, 10x, 2026) or a currency sign
const AMOUNT = /[\p{Nd}\p{Sc}]/u;

const normalize = (word: string) =>
  word.toLocaleLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, "").replace(/['’]s$/, "");

const listCache = new WeakMap<readonly string[], Set<string>>();
const setOf = (list: readonly string[]) => {
  let set = listCache.get(list);
  if (!set) {
    set = new Set(list.map(normalize));
    listCache.set(list, set);
  }
  return set;
};

/**
 * Emphasis for a word picked out automatically: 1 for numbers, amounts,
 * percentages and currency, and for words in `keywords` (case and
 * punctuation ignored); 0 for the rest. Presets use it through
 * `autoEmphasis`.
 *
 * @example
 * ```ts
 * keywordEmphasis("$10,000"); // 1
 * keywordEmphasis("Never!");  // 1
 * keywordEmphasis("week");    // 0
 * ```
 *
 * @public
 */
export const keywordEmphasis = (word: string, keywords: readonly string[] = KEYWORDS) =>
  AMOUNT.test(word) || setOf(keywords).has(normalize(word)) ? 1 : 0;
