// Affiliate / search links for the song currently playing. The IDs come from
// the VITE_AMAZON_TAG / VITE_RAKUTEN_AFFILIATE_ID env vars (.env.production);
// they are public by nature (they appear in every generated link). With an ID
// unset, that store's link is a plain search link and isn't marked as an ad.
// Amazon requires the site the links appear on (request.tokyo) to be
// registered in the Associates account's site list.
const AMAZON_TAG = import.meta.env.VITE_AMAZON_TAG?.trim();
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

export function musicLinks(title: string): MusicLink[] {
  const kw = searchKeyword(title);
  if (!kw) return [];
  const q = encodeURIComponent(kw);
  const rakutenTarget = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${q}/`);
  const rakutenPlain = `https://search.rakuten.co.jp/search/mall/${q}/`;
  return [
    {
      key: "amazon",
      label: "Amazonで探す",
      href: `https://www.amazon.co.jp/s?k=${q}&i=popular${AMAZON_TAG ? `&tag=${encodeURIComponent(AMAZON_TAG)}` : ""}`,
      affiliate: Boolean(AMAZON_TAG),
    },
    {
      key: "rakuten",
      label: "楽天で探す",
      href: RAKUTEN_AFFILIATE_ID
        ? `https://hb.afl.rakuten.co.jp/hgc/${encodeURIComponent(RAKUTEN_AFFILIATE_ID)}/?pc=${rakutenTarget}&m=${rakutenTarget}`
        : rakutenPlain,
      affiliate: Boolean(RAKUTEN_AFFILIATE_ID),
    },
    { key: "apple", label: "Apple Music", href: `https://music.apple.com/jp/search?term=${q}`, affiliate: false },
    { key: "spotify", label: "Spotify", href: `https://open.spotify.com/search/${q}`, affiliate: false },
  ];
}
