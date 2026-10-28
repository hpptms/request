// Affiliate / search links for the song currently playing. The IDs come from
// the VITE_RAKUTEN_AFFILIATE_ID env var (.env.production); it is public by
// nature (it appears in every generated link). With the ID unset, the store
// link is a plain search link and isn't marked as an ad.
const RAKUTEN_AFFILIATE_ID = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID?.trim();

// A video title as a search keyword: bracketed tags (【MV】, (Official Video),
// [HD] ...) are noise for a store search.
export function searchKeyword(title: string): string {
  return title
    .replace(/[【［\[(（〈＜<《][^】］\])）〉＞>》]*[】］\])）〉＞>》]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface MusicLink {
  key: string;
  label: string;
  href: string;
  // True for links that can earn a commission (shown as ads).
  affiliate: boolean;
}

// True when the store link earns a commission (ad disclosure is needed).
export const hasAffiliateLinks = Boolean(RAKUTEN_AFFILIATE_ID);

// The store link (Rakuten) for a free-text keyword (an artist
// name, or an already-cleaned title).
export function storeLinks(keyword: string): MusicLink[] {
  const kw = keyword.trim();
  if (!kw) return [];
  const q = encodeURIComponent(kw);
  const rakutenTarget = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${q}/`);
  const rakutenPlain = `https://search.rakuten.co.jp/search/mall/${q}/`;
  return [
    {
      key: "rakuten",
      label: "楽天",
      href: RAKUTEN_AFFILIATE_ID
        ? `https://hb.afl.rakuten.co.jp/hgc/${encodeURIComponent(RAKUTEN_AFFILIATE_ID)}/?pc=${rakutenTarget}&m=${rakutenTarget}`
        : rakutenPlain,
      affiliate: Boolean(RAKUTEN_AFFILIATE_ID),
    },
  ];
}

// Store links plus plain Apple Music / Spotify searches for a video title.
export function musicLinks(title: string): MusicLink[] {
  const kw = searchKeyword(title);
  if (!kw) return [];
  const q = encodeURIComponent(kw);
  return [
    ...storeLinks(kw),
    { key: "apple", label: "Apple Music", href: `https://music.apple.com/jp/search?term=${q}`, affiliate: false },
    { key: "spotify", label: "Spotify", href: `https://open.spotify.com/search/${q}`, affiliate: false },
  ];
}
