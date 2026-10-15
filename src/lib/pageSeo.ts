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
    title: "動画リクエストキュー | みんなで一緒に動画を見るリクエストサイト",
    description:
      "動画リクエストキューは、リクエスタ(リクエスター)がYouTube・ニコニコ動画・Vimeoの動画をリクエストして、みんなで一緒に動画を見られる視聴者参加型の動画リクエストサイトです。いいね・bad投票でリクエストの再生順が変わります。",
  },
  "/play": {
    title: "みんなで一緒に動画を見る 再生画面 | 動画リクエストキュー",
    description:
      "リクエストされた動画をみんなで一緒に見られる再生画面です。現在再生中の動画をその場で見ながら、いいね・bad投票や動画リクエストができます。",
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
      "動画リクエストキューの使い方ガイド。動画のリクエスト方法、いいね・bad・超いいね・スベってるの違い、早送りタイム、今日のテーマ、集計ランキングやヒートマップの見方を初めての方向けに解説します。",
  },
  "/faq": {
    title: "よくある質問 | 動画リクエストキュー",
    description:
      "動画リクエストキューのよくある質問。登録の要否、対応している動画サイト、リクエストの取り消し方、いいね・超いいね・bad・スベってるの違い、投票の上限などにお答えします。",
  },
  "/terms": {
    title: "利用規約 | 動画リクエストキュー",
    description: "動画リクエストキューの利用規約です。禁止事項、投稿されたリクエストの取り扱い、免責事項などを定めています。",
  },
  "/about": {
    title: "サイトについて | 動画リクエストキュー",
    description:
      "動画リクエストキューは、リクエスタがリクエストした動画をみんなで一緒に見られる動画リクエストサイトです。運営者情報・サービスの目的についてのページです。",
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
