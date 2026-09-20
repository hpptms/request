// Affiliate / search links for the song currently playing. The IDs below are
// public by nature (they appear in every generated link); they are the
// account-level Amazon Associates tracking ID and Rakuten Affiliate ID.
// Amazon requires the site the links appear on (request.tokyo) to be
// registered in the Associates account's site list.
export const AMAZON_TAG = "itemsearch05-22";
export const RAKUTEN_AFFILIATE_ID = "560e48fa.f59f215f.560e48fb";

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
  return [
    {
      key: "amazon",
      label: "Amazonで探す",
      href: `https://www.amazon.co.jp/s?k=${q}&i=popular&tag=${AMAZON_TAG}`,
      affiliate: true,
    },
    {
      key: "rakuten",
      label: "楽天で探す",
      href: `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${rakutenTarget}&m=${rakutenTarget}`,
      affiliate: true,
    },
    { key: "apple", label: "Apple Music", href: `https://music.apple.com/jp/search?term=${q}`, affiliate: false },
    { key: "spotify", label: "Spotify", href: `https://open.spotify.com/search/${q}`, affiliate: false },
  ];
}
