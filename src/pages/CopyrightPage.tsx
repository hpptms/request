import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { ContentList, ContentPageLayout, ContentSection } from "../components/ContentPageLayout";
import { usePageSeo } from "../lib/useSeo";

// 著作権ガイドライン (/copyright)。動画の再生方法の説明と、権利者からの
// 停止依頼の受付窓口を示す。
function CopyrightPage() {
  usePageSeo("/copyright");

  return (
    <ContentPageLayout title="著作権ガイドライン">
      <ContentSection
        heading="1. 基本方針"
        paragraphs={[
          "動画リクエストキュー(以下「当サイト」)は、YouTube・ニコニコ動画・Vimeo等の動画サービス上で、投稿者が埋め込み再生(外部サイトでの再生)を許可している動画を、利用者の皆様が同じタイミングで一緒に視聴して楽しむためのサービスです。",
          "当サイトは、動画の著作権者・投稿者の皆様の権利を尊重し、権利を侵害することのない運営に努めます。",
        ]}
      />

      <ContentSection heading="2. 当サイトでの動画の再生方法について">
        <ContentList
          items={[
            "当サイト上の動画は、各動画サービスが公式に提供している埋め込みプレイヤー(YouTube IFrame Player API等)を利用して表示しています。",
            "当サイトのサーバーに動画ファイルをダウンロード・保存することはありません。当サイト上で再生される映像・音声は、各動画サービスのサーバーから視聴者の端末へ直接届けられます。",
            "そのため、当サイト上での再生回数や広告収益などは、通常の視聴と同じく各動画サービスを通じて投稿者の皆様に還元されます。",
            "投稿者が埋め込み再生を許可していない動画、または各動画サービスの判断で外部再生が制限されている動画は、当サイトでは再生されません。",
            "動画の著作権その他の権利は、各著作権者・投稿者に帰属します。",
          ]}
        />
      </ContentSection>

      <ContentSection heading="3. 利用者の皆様へのお願い" paragraphs={["次のような動画のリクエストは禁止しています。"]}>
        <ContentList
          items={[
            "権利者の許可なくアップロードされた動画(テレビ番組・映画・アニメ・楽曲等の無断転載など)",
            "他者の著作権・著作隣接権・肖像権・プライバシー等を侵害する、またはそのおそれのある動画",
            "その他、法令または各動画サービスの利用規約に違反する動画",
          ]}
        />
        <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
          これらに該当すると運営が判断した場合、予告なくリクエストの削除や利用制限を行うことがあります。
        </Typography>
      </ContentSection>

      <ContentSection heading="4. 著作権者・投稿者の皆様へ">
        <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
          ご自身が権利を持つ動画について、当サイトでの再生や、運営者が行う配信での使用を望まれない場合は、
          <Link component={RouterLink} to="/contact">
            お問い合わせ
          </Link>
          に記載の窓口から以下をお知らせください。内容を確認のうえ、速やかに再生・使用を停止いたします。
        </Typography>
        <ContentList
          items={[
            "対象となる動画のURL",
            "権利者ご本人、または正当な代理人であることが分かる情報",
            "ご連絡先",
          ]}
        />
        <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
          また、YouTubeをご利用の場合は、YouTube Studioの動画設定で「埋め込みを許可」をオフにすると、当サイトを含む外部サイトでの再生を止めることができます(すべての外部サイトが対象になります)。
        </Typography>
      </ContentSection>

      <ContentSection heading="5. 運営による対応">
        <ContentList
          items={[
            "権利侵害のおそれがある動画を見つけた場合、またはご連絡を受けた場合は、利用者のリクエストか運営側が選んだ動画かにかかわらず、再生停止・リクエスト削除・再登録の防止などの必要な措置をとります。",
            "対応の内容は、必要に応じてご連絡いただいた方にお知らせします。",
          ]}
        />
      </ContentSection>

      <ContentSection heading="6. 改定" paragraphs={["本ガイドラインは、必要に応じて予告なく改定することがあります。"]} />

      <ContentSection heading="制定日" paragraphs={["2026年10月25日 制定"]} />
    </ContentPageLayout>
  );
}

export default CopyrightPage;
