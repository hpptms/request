// Per-route <title>/description for every public, indexable page. Shared by
// the pages' useSeo calls (runtime, after JS mounts) and vite.config.ts's
// prerender step, which writes dist/<route>.html with these baked into the
// static <head> — so a crawler's first, pre-JS look at /guide already sees
// /guide's own title and canonical instead of index.html's home-page ones
// (a canonical pointing at "/" on every route made Google fold them all into
// the home page). Keep this file free of browser/React imports: it's also
// loaded by the Node-side Vite config.
export type PagePath =
  | "/"
  | "/play"
  | "/stats"
  | "/heatmap"
  | "/notice"
  | "/guide"
  | "/faq"
  | "/terms"
  | "/about"
  | "/privacy"
  | "/contact";

export const PAGE_SEO: Record<PagePath, { title: string; description: string }> = {
  "/": {
    title: "動画リクエストキュー | 登録不要でみんなと動画を同時視聴できるリクエストサイト",
    description:
      "登録不要。YouTube・ニコニコ動画・Vimeoの動画をリクエストして、知らない人とみんなで同時視聴。いいね・bad投票で再生順が決まります。FC2ライブ・ニコ生でも同時視聴配信中。",
  },
  "/play": {
    title: "YouTube・ニコニコ動画をみんなで同時視聴 | 動画リクエストキュー",
    description:
      "登録不要・開くだけで、YouTube・ニコニコ動画を知らない人とみんなで同時視聴。いま再生中の動画を見ながら、チャット・いいね・bad投票・動画リクエストができます。",
  },
  "/stats": {
    title: "集計 | 動画リクエストキュー",
    description:
      "動画リクエストキューで、リクエスタから動画リクエストの多いアーティスト・動画、いいね・bad(キャンセル投票)の多い動画を日別・週別・累計で集計したランキングです。",
  },
  "/heatmap": {
    title: "アクティブユーザーヒートマップ | 動画リクエストキュー",
    description: "動画リクエストキューを今見ている人を都市別のバブルマップで表示します。",
  },
  "/notice": {
    title: "お知らせ | 動画リクエストキュー",
    description: "動画リクエストキューのお知らせ・ルール・直近の変更点と、管理者へのメッセージ送信ページです。",
  },
  "/guide": {
    title: "使い方ガイド | 動画リクエストキュー",
    description:
      "YouTube・ニコニコ動画をみんなで同時視聴できる動画リクエストキューの使い方ガイド。動画のリクエスト方法、いいね・bad・超いいね・スベってるの違い、早送りタイム、今日のテーマ、ニコ生・FC2ライブ配信との関係を初めての方向けに解説します。",
  },
  "/faq": {
    title: "よくある質問 | 動画リクエストキュー",
    description:
      "動画リクエストキューのよくある質問。登録なしでYouTubeを同時視聴できるか、ニコ生・FC2ライブ配信との関係、対応している動画サイト、リクエストの取り消し方、投票の上限などにお答えします。",
  },
  "/terms": {
    title: "利用規約 | 動画リクエストキュー",
    description: "動画リクエストキューの利用規約です。禁止事項、投稿されたリクエストの取り扱い、免責事項などを定めています。",
  },
  "/about": {
    title: "サイトについて | 動画リクエストキュー",
    description:
      "動画リクエストキューは、リクエストされたYouTube・ニコニコ動画をみんなで同時視聴できる動画リクエストサイトです。運営者情報・サービスの目的についてのページです。",
  },
  "/privacy": {
    title: "プライバシーポリシー | 動画リクエストキュー",
    description: "動画リクエストキューにおける個人情報の取り扱い、Cookie・アクセス解析・広告配信についてのプライバシーポリシーです。",
  },
  "/contact": {
    title: "お問い合わせ | 動画リクエストキュー",
    description: "動画リクエストキューへのご意見・不具合報告等のお問い合わせ方法についてのページです。",
  },
};
