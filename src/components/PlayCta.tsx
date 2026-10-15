import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Link as RouterLink } from "react-router-dom";

// 再生画面(/play)への大きな誘導ボタン。検索から来た人の最終的な行き先を
// /play にしたいので、トップ・ガイド・FAQに置く。リンク文言に「同時視聴」を
// 含めておくと、/play が何のページかを検索エンジンにも伝えられる。
export function PlayCta({ caption = "登録不要。開くだけで、いま再生中の動画をみんなと一緒に見られます。" }: { caption?: string }) {
  return (
    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
      <Button
        component={RouterLink}
        to="/play"
        variant="contained"
        size="large"
        startIcon={<PlayCircleIcon />}
        sx={{ px: 4, py: 1.25, fontWeight: 700, fontSize: "1.05rem", width: { xs: "100%", sm: "auto" } }}
      >
        みんなで同時視聴する
      </Button>
      <Typography variant="body2" color="text.secondary">
        {caption}
      </Typography>
    </Stack>
  );
}
