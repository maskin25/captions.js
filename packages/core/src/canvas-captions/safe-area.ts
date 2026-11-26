/**
 * Margins of a frame that captions must stay out of, as fractions of the
 * frame (0–1): `top` and `bottom` of its height, `left` and `right` of its
 * width.
 *
 * @public
 */
export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Platforms with a built-in safe area, plus `"none"` (no margins).
 *
 * @public
 */
export type SafeAreaName = "tiktok" | "reels" | "shorts" | "none";

/**
 * Where each platform's interface covers a 9:16 video, from its published
 * ad guidance (checked November 2026):
 *
 * - `shorts`: Google's vertical safe-zone overlay for YouTube Shorts ads,
 *   1080×1920 with 288 px top, 672 px bottom, 48 px left and 192 px right
 *   (the action buttons) covered.
 *   https://support.google.com/google-ads/answer/13547298
 * - `reels`: Meta's Reels ad specs, "leaving at least 14% of the top, 35% of
 *   the bottom, and 6% on each side" free.
 *   https://www.facebook.com/business/ads-guide/update/video/instagram-reels
 * - `tiktok`: TikTok publishes its In-Feed safe zone only as downloadable
 *   template files. These are the margins third-party guides report from
 *   that template, 240 px top, 660 px bottom and 120 px each side, not
 *   measured by us.
 *   https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads
 *
 * @public
 */
export const SAFE_AREAS: Record<SafeAreaName, SafeAreaInsets> = {
  tiktok: { top: 240 / 1920, bottom: 660 / 1920, left: 120 / 1080, right: 120 / 1080 },
  reels: { top: 0.14, bottom: 0.35, left: 0.06, right: 0.06 },
  shorts: { top: 288 / 1920, bottom: 672 / 1920, left: 48 / 1080, right: 192 / 1080 },
  none: { top: 0, bottom: 0, left: 0, right: 0 },
};

/**
 * The insets for a `safeArea` setting, or `undefined` when it is unset (the
 * renderer then keeps its fixed bottom offset for portrait video).
 *
 * @throws Error for an unknown name or insets outside 0–1 that leave no room.
 * @public
 */
export const resolveSafeArea = (
  safeArea: SafeAreaName | SafeAreaInsets | undefined,
): SafeAreaInsets | undefined => {
  if (safeArea === undefined || safeArea === null) return undefined;
  if (typeof safeArea === "string") {
    const insets = SAFE_AREAS[safeArea.toLowerCase() as SafeAreaName];
    if (!insets) {
      throw new Error(
        `captions.js: unknown safeArea "${safeArea}". Use ${Object.keys(SAFE_AREAS).join(", ")} or { top, bottom, left, right }.`,
      );
    }
    return insets;
  }
  const { top = 0, bottom = 0, left = 0, right = 0 } = safeArea;
  const all = [top, bottom, left, right];
  if (all.some((v) => typeof v !== "number" || !Number.isFinite(v) || v < 0 || v >= 1) || top + bottom >= 1 || left + right >= 1) {
    throw new Error(
      "captions.js: safeArea insets are fractions of the frame (0–1), and top + bottom and left + right must each be below 1.",
    );
  }
  return { top, bottom, left, right };
};
