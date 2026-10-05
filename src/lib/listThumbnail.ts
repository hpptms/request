// キュー/履歴の一覧サムネイルは最大64x48pxしか表示しないので、YouTubeの
// hqdefault(480x360, ~25KB)の代わりに同じ4:3のdefault(120x90, ~3KB)を使う。
// PageSpeed Insightsの「適切なサイズの画像」指摘(1枚あたり~25KBの無駄)対策。
// YouTube以外(ニコニコ/Vimeo)のURLはそのまま返す。
export function listThumbnail(url: string): string {
  return url.replace(/^(https:\/\/i\.ytimg\.com\/vi\/[^/]+\/)hqdefault\.jpg$/, "$1default.jpg");
}
