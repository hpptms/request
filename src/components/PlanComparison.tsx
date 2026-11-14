import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Link as RouterLink } from "react-router-dom";
import { getLikePriorityThreshold, useAccount } from "../lib/account";
import type { AccountMe } from "../types";

export const PLAN_NAME = "サポーター プラン";
export const PLAN_PRICE = "月額200円";

// 無料プランとサポーター プランの違い。数字はすべてバックエンドの実際の
// 上限(/api/account/me)から出す。current は今のプランの列を強調する。
export function PlanComparisonTable({ me, current }: { me: AccountMe; current?: "free" | "supporter" }) {
  const rows: [string, string, string][] = [
    ["料金", "無料", PLAN_PRICE],
    [
      "リクエスト",
      `${me.freeRequestIntervalMinutes / 60}時間に1回まで（キューに${me.freeMaxPending ?? 1}曲まで）`,
      `待ち時間なし（キューに${me.supporterMaxPending}曲まで）`,
    ],
    ["再生の順番", `いいね${getLikePriorityThreshold()}票で優先`, `最初から優先（いいね${getLikePriorityThreshold()}票と同じ）`],
    ["いいね（1時間あたり）", `${me.freeVoteLimits.like}票`, `${me.supporterVoteLimits.like}票`],
    ["bad（1時間あたり）", `${me.freeVoteLimits.bad}票`, `${me.supporterVoteLimits.bad}票`],
    ["広告", "表示あり", "表示なし"],
  ];
  const highlight = (plan: "free" | "supporter") => (current === plan ? { bgcolor: "action.selected", fontWeight: "bold" } : {});
  const cell = { px: { xs: 1, sm: 2 }, py: 1 } as const;
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Table size="small" aria-label="プランの違い">
        <TableHead>
          <TableRow>
            <TableCell sx={cell} />
            <TableCell sx={{ ...cell, fontWeight: "bold", ...highlight("free") }}>
              無料プラン{current === "free" && "（現在）"}
            </TableCell>
            <TableCell sx={{ ...cell, fontWeight: "bold", color: "primary.main", ...highlight("supporter") }}>
              {PLAN_NAME}
              {current === "supporter" && "（現在）"}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([label, free, supporter]) => (
            <TableRow key={label} sx={{ "&:last-child td": { borderBottom: 0 } }}>
              <TableCell component="th" scope="row" sx={{ ...cell, color: "text.secondary", whiteSpace: { sm: "nowrap" } }}>
                {label}
              </TableCell>
              <TableCell sx={{ ...cell, ...highlight("free") }}>{free}</TableCell>
              <TableCell sx={{ ...cell, ...highlight("supporter") }}>{supporter}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

// トップページ用: 会員機能がONで、サポーターでない人にだけ出す。
export function PlanComparisonBox() {
  const account = useAccount();
  if (account.status !== "ready" || account.me.user?.plan === "supporter") return null;
  const { me } = account;
  return (
    <Box component="section">
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        プランの違い
      </Typography>
      <PlanComparisonTable me={me} current={me.user ? "free" : undefined} />
      <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
        <Button component={RouterLink} to="/account" variant="outlined" size="small" startIcon={<FavoriteIcon />}>
          {me.user ? `${PLAN_NAME}について` : "ログイン・新規登録"}
        </Button>
      </Box>
    </Box>
  );
}
