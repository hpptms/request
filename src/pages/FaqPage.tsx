import { useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ContentPageLayout } from "../components/ContentPageLayout";
import { useSeo } from "../lib/useSeo";

const FAQ_SCRIPT_ID = "seo-faq";

interface Faq {
  q: string;
  a: string;
}

const FAQ_GROUPS: { heading: string; items: Faq[] }[] = [
  {
    heading: "はじめに",
    items: [
      {
        q: "利用するのに登録やログインは必要ですか？",
        a: "必要ありません。トップページを開けば、すぐにリクエストや投票ができます。メールアドレスなどの個人情報の入力も不要です。",
      },
      {
        q: "利用料金はかかりますか？",
        a: "無料でご利用いただけます。サイトの運営費は広告収入などでまかなっています。",
      },
      {
        q: "スマートフォンでも使えますか？",
        a: "はい。スマートフォン・タブレット・パソコンのブラウザに対応しています。スマートフォンでは画面幅に合わせてボタンや一覧の配置が切り替わります。",
      },
    ],
  },
  {
    heading: "リクエストについて",
    items: [
      {
        q: "どのサイトの動画をリクエストできますか？",
        a: "YouTube・ニコニコ動画・Vimeoの動画URLに対応しています。それ以外のサイトのURLや、非公開・埋め込みが禁止されている動画は再生できません。",
      },
      {
        q: "リクエストを取り消したいです。",
        a: "自分が送ったリクエストには「自分のリクエストをキャンセル」ボタンが表示されます。再生前でも再生中でも取り消せます。",
      },
      {
        q: "同じ動画をもう一度リクエストできません。",
        a: "同じ動画が短時間に何度も流れるのを防ぐため、前回のリクエストから一定時間(現在は2時間)たつまでは再リクエストできません。",
      },
      {
        q: "リクエストが送れなくなりました。",
        a: "待機中のリクエストが多いときは1人1曲までに制限されます。また、短時間に操作を繰り返すと荒らし対策として一時的にBANされることがあります。BANされた場合はお知らせページに理由が表示され、管理者へメッセージを送ることもできます。",
      },
      {
        q: "名前欄には何を書けばいいですか？",
        a: "ニックネームなど、再生画面に表示されても問題ない名前を入力してください。入力は任意で、空欄の場合は名前は表示されません。本名や連絡先は入力しないでください。",
      },
    ],
  },
  {
    heading: "投票について",
    items: [
      {
        q: "いいねと超いいねの違いは何ですか？",
        a: "超いいね(😍)は、いいね2票分として数えられます。特にみんなに見てほしい動画、もっと長く見たい動画に使ってください。",
      },
      {
        q: "badを押すとどうなりますか？",
        a: "badが一定数集まると、再生中の動画が短く切り上げられ、次の動画に進みます。動画そのものや投稿者を攻撃する目的ではなく、場の流れを整えるための仕組みです。",
      },
      {
        q: "スベってる(😒)は何のためのボタンですか？",
        a: "ペナルティのない、気軽なリアクション用のボタンです。再生順や再生時間には影響せず、集計ページの「スベってるの多い動画」ランキングに反映されます。",
      },
      {
        q: "投票できる回数に上限はありますか？",
        a: "いいねとbadには1時間あたりの上限があり、毎時0分に回復します。残り票数は画面に表示されます。スベってるに上限はありませんが、1つの動画につき1人1回までです。",
      },
    ],
  },
  {
    heading: "その他",
    items: [
      {
        q: "集計のアーティスト名が間違っています。",
        a: "アーティスト名は動画タイトルから自動で推定しているため、タイトルの書き方によっては正しく判定できない場合があります。",
      },
      {
        q: "ヒートマップで自分の居場所が分かってしまいませんか？",
        a: "ヒートマップはアクセス解析の地域情報(市区町村程度の大まかな単位)を集計したもので、個人を特定できる情報は表示していません。",
      },
      {
        q: "不具合を見つけた・要望があります。",
        a: "お知らせページの「管理者へメッセージ」から送るか、お問い合わせページに記載のX(旧Twitter)アカウントまでご連絡ください。いただいたご意見は今後の改善の参考にさせていただきます。",
      },
    ],
  },
];

// よくある質問 (/faq)。FAQPage構造化データも併せて出力する。
function FaqPage() {
  useSeo(
    "よくある質問 | 動画リクエストキュー",
    "動画リクエストキューのよくある質問。登録の要否、対応している動画サイト、リクエストの取り消し方、いいね・超いいね・bad・スベってるの違い、投票の上限などにお答えします。",
    "/faq",
  );

  useEffect(() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = FAQ_SCRIPT_ID;
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  return (
    <ContentPageLayout title="よくある質問" lead="動画リクエストキューについて、よくいただく質問とその回答をまとめました。">
      {FAQ_GROUPS.map((group) => (
        <Box component="section" key={group.heading}>
          <Typography variant="h6" component="h2" gutterBottom>
            {group.heading}
          </Typography>
          {group.items.map(({ q, a }) => (
            <Accordion key={q} disableGutters variant="outlined" defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
                  {a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}
    </ContentPageLayout>
  );
}

export default FaqPage;
