import Typography from "@mui/material/Typography";
import { ContentPageLayout } from "../components/ContentPageLayout";
import { PollCard } from "../components/PollCard";
import { usePolls } from "../lib/usePolls";
import { usePageSeo } from "../lib/useSeo";

// アンケート一覧 (/polls): 受付中のアンケートへの回答と、締め切ったものの結果。
function PollsPage() {
  usePageSeo("/polls");
  const { polls, loaded, answer } = usePolls();

  return (
    <ContentPageLayout title="アンケート" lead="サイトの運営についてのアンケートです。1人1回答で、受付中はいつでも回答を変更できます。">
      {loaded && polls.length === 0 && <Typography color="text.secondary">アンケートはまだありません</Typography>}
      {polls.map((p) => (
        <PollCard key={p.id} poll={p} onAnswer={(choices) => answer(p.id, choices)} />
      ))}
    </ContentPageLayout>
  );
}

export default PollsPage;
