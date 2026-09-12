import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import RefreshIcon from "@mui/icons-material/Refresh";
import { api } from "../api";
import type { ChannelStat, StatsSummary, VideoStat } from "../types";

// 集計データ画面 (/admin/stats): backend/internal/analytics に蓄積された
// 「動画/チャンネルごとの累計リクエスト数・いいね数・bad(キャンセル投票)数」
// を表示する。store.Store は再生済み(done)リクエストを再起動のたびに
// 破棄するため(store.Store.SaveToFile参照)、ここに出る数字だけが再起動を
// またいで残る唯一の履歴。
function AdminStatsPage() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErrorMessage(null);
    api
      .adminGetStats()
      .then(setStats)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          再起動をまたいで蓄積された累計データです。プレイリスト再生・フォールバック再生分は含まれません。
        </Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          更新
        </Button>
      </Stack>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {loading && !stats ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <>
          <Section title="リクエストの多いアーティスト / チャンネル">
            <ChannelTable rows={stats.topChannelsByRequests} />
          </Section>

          <Section title="リクエストの多い動画">
            <VideoTable rows={stats.topVideosByRequests} valueKey="requestCount" valueLabel="リクエスト数" />
          </Section>

          <Section title="いいねの多い動画">
            <VideoTable rows={stats.topVideosByLikes} valueKey="totalLikes" valueLabel="いいね数" />
          </Section>

          <Section title="badの多い動画">
            <VideoTable rows={stats.topVideosByCancelVotes} valueKey="totalCancelVotes" valueLabel="bad数" />
          </Section>
        </>
      ) : null}
    </Stack>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function ChannelTable({ rows }: { rows: ChannelStat[] }) {
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        まだデータがありません
      </Typography>
    );
  }
  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>チャンネル</TableCell>
            <TableCell align="right">リクエスト数</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={row.channelTitle}>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ wordBreak: "break-word" }}>{row.channelTitle}</TableCell>
              <TableCell align="right">{row.requestCount.toLocaleString("ja-JP")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function VideoTable({
  rows,
  valueKey,
  valueLabel,
}: {
  rows: VideoStat[];
  valueKey: "requestCount" | "totalLikes" | "totalCancelVotes";
  valueLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        まだデータがありません
      </Typography>
    );
  }
  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>動画</TableCell>
            <TableCell>チャンネル</TableCell>
            <TableCell align="right">{valueLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={`${row.platform}:${row.videoId}`}>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ wordBreak: "break-word" }}>{row.title}</TableCell>
              <TableCell sx={{ wordBreak: "break-word" }}>{row.channelTitle}</TableCell>
              <TableCell align="right">{row[valueKey].toLocaleString("ja-JP")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default AdminStatsPage;
