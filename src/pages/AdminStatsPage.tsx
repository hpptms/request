import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import { api } from "../api";
import type { ChannelStat, StatsPeriod, StatsSummary, VideoStat } from "../types";

// addDays/formatDateLabel treat a YYYY-MM-DD string as a plain calendar
// date (via Date.UTC), deliberately avoiding the browser's local timezone —
// the date came from (and is sent back to) the backend's own JST-based
// day/week boundaries (see backend/internal/analytics), so shifting it in
// UTC keeps the calendar math independent of whatever timezone the admin's
// browser happens to be in.
function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

// 集計画面 (/admin/stats): backend/internal/analytics に蓄積された「動画/
// チャンネルごとの日別リクエスト数・いいね数・bad(キャンセル投票)数」を、
// 日別/週別/累計で切り替えて表示する。store.Store は再生済み(done)
// リクエストを再起動のたびに破棄するため(store.Store.SaveToFile参照)、
// ここに出る数字だけが再起動をまたいで残る唯一の履歴。
function AdminStatsPage() {
  const [periodTab, setPeriodTab] = useState<StatsPeriod>("day");
  // The date (YYYY-MM-DD) driving prev/next navigation for "day"/"week";
  // null means "let the server pick today" (see load below). Kept in sync
  // with whatever rangeStart the server actually returns.
  const [refDate, setRefDate] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback((period: StatsPeriod, date: string | null) => {
    setLoading(true);
    setErrorMessage(null);
    api
      .adminGetStats(period, date ?? undefined)
      .then((result) => {
        setStats(result);
        if (result.rangeStart) setRefDate(result.rangeStart);
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load("day", null);
  }, [load]);

  const handlePeriodChange = (_: unknown, value: StatsPeriod) => {
    setPeriodTab(value);
    load(value, refDate);
  };

  const step = periodTab === "week" ? 7 : 1;
  const handlePrev = () => refDate && load(periodTab, addDays(refDate, -step));
  const handleNext = () => refDate && load(periodTab, addDays(refDate, step));
  const handleJumpToToday = () => load(periodTab, null);

  let rangeLabel = "";
  if (stats?.period === "day" && stats.rangeStart) {
    rangeLabel = formatDateLabel(stats.rangeStart);
  } else if (stats?.period === "week" && stats.rangeStart && stats.rangeEnd) {
    rangeLabel = `${formatDateLabel(stats.rangeStart)} 〜 ${formatDateLabel(stats.rangeEnd)}`;
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={2} sx={{ p: { xs: 1, sm: 1.5 } }}>
        <Tabs value={periodTab} onChange={handlePeriodChange} variant="fullWidth">
          <Tab value="day" label="日別" />
          <Tab value="week" label="週別" />
          <Tab value="all" label="累計" />
        </Tabs>
      </Paper>

      {periodTab !== "all" && (
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", gap: 1 }}>
          <IconButton onClick={handlePrev} disabled={loading || !refDate} aria-label="前へ">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ minWidth: 200, textAlign: "center" }}>
            {rangeLabel || " "}
          </Typography>
          <IconButton onClick={handleNext} disabled={loading || !refDate} aria-label="次へ">
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" onClick={handleJumpToToday} disabled={loading} sx={{ ml: 1 }}>
            {periodTab === "week" ? "今週" : "今日"}
          </Button>
        </Stack>
      )}

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          プレイリスト再生・フォールバック再生分は含まれません。
        </Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={() => load(periodTab, refDate)} disabled={loading}>
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
