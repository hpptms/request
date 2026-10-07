// Master switch for all admax (忍者AdMax / Shinobi Tools) ads: PcRailAd,
// MobileAnchorAd and PlayQueueAd. Was turned off during the first AdSense
// review (admax was serving adult creatives, which could get the
// application rejected); turned back on after that review came back as
// 有用性の低いコンテンツ. Consider setting this to false again before the
// next AdSense re-review request.
export const NINJA_ADS_ENABLED = true;

// The admax ad units' iframe URL: /ad/banner (public/ad/banner.html) served
// from the dedicated ads origin (see MobileAnchorAd.tsx for why it must be a
// separate origin), with the unit's admax tag id. The origin and tag ids
// come from .env (VITE_ADS_ORIGIN / VITE_ADMAX_TAG_*); null when either is
// unset, in which case the unit renders nothing.
const ADS_ORIGIN = import.meta.env.VITE_ADS_ORIGIN?.trim().replace(/\/+$/, "");

export function ninjaAdSrc(tag: string | undefined): string | null {
  const t = tag?.trim();
  if (!ADS_ORIGIN || !t) return null;
  return `${ADS_ORIGIN}/ad/banner?tag=${encodeURIComponent(t)}`;
}
