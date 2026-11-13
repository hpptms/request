import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
import { searchKeyword } from "../lib/affiliate";
import { buildStatsPath, todayJst, type StatsSelection } from "../lib/statsPath";
import { useSeo } from "../lib/useSeo";
import { PAGE_SEO } from "../lib/pageSeo";
import { AffiliateNotice, StoreLinksInline } from "./MusicLinks";
import type { ChannelStat, RequesterStat, StatsPeriod, StatsSummary, TimeSlot, VideoStat } from "../types";

const TIME_SLOT_LABELS: Record<Exclude<TimeSlot, "">, string> = {
  morning: "朝 8-14時",
  daytime: "昼 14-20時",
  evening: "夜 20-2時",
  midnight: "深夜 2-8時",
};

// addDays/formatDateLabel treat a YYYY-MM-DD string as a plain calendar
// date (via Date.UTC), deliberately avoiding the browser's local timezone —
// the date came from (and is sent back to) the backend's own JST-based
// day/week boundaries (see backend/internal/analytics), so shifting it in
// UTC keeps the calendar math independent of whatever timezone the viewer's
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

// Per-URL <title>/description, so each day/week/slot page reads as its own
// ranking in search results rather than a copy of /stats. The description
// names the top artists once loaded, which is what actually differs from
// page to page. Time-of-day pages (mostly a repeat of their whole day) and
// days/weeks the backend deems too thin (stats.indexable) are noindex; the
// backend's stats sitemap lists exactly the pages left indexable.
function useStatsSeo(selection: StatsSelection, stats: StatsSummary | null) {
  const path = buildStatsPath(selection);
  const slotLabel = selection.slot ? `${TIME_SLOT_LABELS[selection.slot]}の` : "";
  let subject: string | null = null;
  if (selection.period === "all") {
    subject = `累計${selection.slot ? `・${TIME_SLOT_LABELS[selection.slot]}` : ""}`;
  } else if (selection.date || selection.slot) {
    const start = stats?.rangeStart;
    const end = stats?.rangeEnd;
    const range =
      selection.period === "week"
        ? start && end
          ? `${formatDateLabel(start)}〜${formatDateLabel(end)}の週`
          : "今週"
        : selection.date
          ? formatDateLabel(selection.date)
          : "今日";
    subject = `${range}${slotLabel ? `・${slotLabel.slice(0, -1)}` : ""}`;
  } else if (selection.period === "week") {
    subject = "今週";
  }

  let title = PAGE_SEO["/stats"].title;
  let description = PAGE_SEO["/stats"].description;
  if (subject !== null) {
    title = `${subject}の動画リクエストランキング | 動画リクエストキュー`;
    const artists = (stats?.topArtistsByRequests ?? []).slice(0, 3).map((a) => a.artist);
    description =
      `動画リクエストキューの${subject}の集計。` +
      (artists.length > 0 ? `リクエストの多かったアーティストは${artists.join("、")}など。` : "") +
      "リクエストの多いアーティスト・チャンネル、いいね・bad・スベってるの多い動画のランキングです。";
  }
  const noindex = subject !== null && (selection.slot !== "" || stats?.indexable === false);
  useSeo(title, description, path, { noindex });
}

// Shared body for the stats screen: backend/internal/analytics に蓄積された
// 「動画/チャンネルごとの日別リクエスト数・いいね数・bad(キャンセル投票)数」
// を、日別/週別/累計で切り替えて表示する。store.Store は再生済み(done)
// リクエストを再起動のたびに破棄するため(store.Store.SaveToFile参照)、
// ここに出る数字だけが再起動をまたいで残る唯一の履歴。集計自体は
// GET /api/stats が公開エンドポイントのため、公開の集計画面(StatsPage)で
// このコンポーネントを使う。
export function StatsView({ selection }: { selection: StatsSelection }) {
  const { period: periodTab, date, slot: timeSlot } = selection;
  const navigate = useNavigate();
  // The date (YYYY-MM-DD) driving prev/next navigation for "day"/"week" —
  // whatever rangeStart the server actually returned, since a dateless URL
  // ("today") or a mid-week date only resolves to a concrete range there.
  const [refDate, setRefDate] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    api
      .getStats(periodTab, date ?? undefined, timeSlot || undefined)
      .then((result) => {
        if (cancelled) return;
        setStats(result);
        setRefDate(result.rangeStart ?? null);
        // A week URL naming a mid-week day is the same page as the week's
        // first day: settle on that one address.
        if (periodTab === "week" && date && result.rangeStart && result.rangeStart !== date) {
          navigate(buildStatsPath({ period: "week", date: result.rangeStart, slot: timeSlot }), { replace: true });
        }
      })
      .catch((err) => !cancelled && setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [periodTab, date, timeSlot, reloadKey, navigate]);

  const pathFor = (changes: Partial<StatsSelection>) => buildStatsPath({ ...selection, ...changes });

  const handlePeriodChange = (_: unknown, value: StatsPeriod) => {
    navigate(pathFor({ period: value, date: value === "all" ? null : date }));
  };

  const handleTimeSlotChange = (_: unknown, value: TimeSlot) => {
    navigate(pathFor({ slot: value }));
  };

  const step = periodTab === "week" ? 7 : 1;
  const prevPath = refDate ? pathFor({ date: addDays(refDate, -step) }) : null;
  // No links into the future: those pages are always empty.
  const nextDate = refDate ? addDays(refDate, step) : null;
  const nextPath = nextDate && nextDate <= todayJst() ? pathFor({ date: nextDate }) : null;

  let rangeLabel = "";
  if (stats?.period === "day" && stats.rangeStart) {
    rangeLabel = formatDateLabel(stats.rangeStart);
  } else if (stats?.period === "week" && stats.rangeStart && stats.rangeEnd) {
    rangeLabel = `${formatDateLabel(stats.rangeStart)} 〜 ${formatDateLabel(stats.rangeEnd)}`;
  }

  useStatsSeo(selection, stats);

  return (
    <Stack spacing={3}>
      <Paper elevation={2} sx={{ p: { xs: 1, sm: 1.5 } }}>
        <Tabs value={periodTab} onChange={handlePeriodChange} variant="fullWidth">
          <Tab value="day" label="日別" />
          <Tab value="week" label="週別" />
          <Tab value="all" label="累計" />
        </Tabs>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 1, sm: 1.5 } }}>
        <Tabs value={timeSlot} onChange={handleTimeSlotChange} variant="scrollable" scrollButtons="auto">
          <Tab value="" label="すべての時間帯" />
          {Object.entries(TIME_SLOT_LABELS).map(([slot, label]) => (
            <Tab key={slot} value={slot} label={label} />
          ))}
        </Tabs>
      </Paper>

      {periodTab !== "all" && (
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", gap: { xs: 0.5, sm: 1 }, flexWrap: "wrap" }}>
          {/* Real links (not onClick), so crawlers can walk from day to day. */}
          {prevPath && !loading ? (
            <IconButton component={RouterLink} to={prevPath} aria-label="前へ">
              <ChevronLeftIcon />
            </IconButton>
          ) : (
            <IconButton disabled aria-label="前へ">
              <ChevronLeftIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" component="h2" sx={{ minWidth: { sm: 200 }, textAlign: "center" }}>
            {rangeLabel || " "}
          </Typography>
          {nextPath && !loading ? (
            <IconButton component={RouterLink} to={nextPath} aria-label="次へ">
              <ChevronRightIcon />
            </IconButton>
          ) : (
            <IconButton disabled aria-label="次へ">
              <ChevronRightIcon />
            </IconButton>
          )}
          <Button size="small" component={RouterLink} to={pathFor({ date: null })} disabled={loading} sx={{ ml: 1 }}>
            {periodTab === "week" ? "今週" : "今日"}
          </Button>
        </Stack>
      )}

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          プレイリスト再生・フォールバック再生分は含まれません。
        </Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
          更新
        </Button>
      </Stack>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {stats?.previousDayFallback && (
        <Alert severity="info">本日分のデータがまだないため、前日のデータを表示しています。</Alert>
      )}

      {loading && !stats ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <>
          <Section title="リクエストの多いアーティスト(推定)">
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              動画のタイトルとチャンネル名から自動で推定しているため、誤りや抜けがあります。
            </Typography>
            <ChannelTable
              rows={(stats.topArtistsByRequests ?? []).map((a) => ({
                channelTitle: a.artist,
                requestCount: a.requestCount,
              }))}
              label="アーティスト"
              storeLinks
            />
            <Box sx={{ mt: 1.5 }}>
              <AffiliateNotice />
            </Box>
          </Section>

          <Section title="リクエストの多いチャンネル">
            <ChannelTable rows={stats.topChannelsByRequests} />
          </Section>

          <Section title="いいねの多い動画">
            <Box sx={{ mb: 1.5 }}>
              <AffiliateNotice />
            </Box>
            <VideoTable rows={stats.topVideosByLikes} valueKey="totalLikes" valueLabel="いいね数" />
          </Section>

          <Section title="いいねの多いリクエスト者">
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              名前を入れてリクエストした人のみ集計しています。同じ名前は同一人物として合算されます。
            </Typography>
            <RequesterTable rows={stats.topRequestersByLikes ?? []} />
          </Section>

          <Section title="badの多い動画">
            <VideoTable rows={stats.topVideosByCancelVotes} valueKey="totalCancelVotes" valueLabel="bad数" />
          </Section>

          <Section title="スベってる(😒)の多い動画">
            <VideoTable rows={stats.topVideosBySuberu ?? []} valueKey="totalSuberu" valueLabel="スベってる数" />
          </Section>
        </>
      ) : null}
    </Stack>
  );
}

// The watch-page URL for a stat row, rebuilt from platform + videoId (the
// stats API doesn't send a URL). Channels get no link: only the channel's
// display name is recorded, not its ID/URL. Unknown platforms yield null so
// the title is just shown as text.
function videoUrl(platform: string, videoId: string): string | null {
  const id = encodeURIComponent(videoId);
  switch (platform) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${id}`;
    case "niconico":
      return `https://www.nicovideo.jp/watch/${id}`;
    case "vimeo":
      return `https://vimeo.com/${id}`;
    default:
      return null;
  }
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

// Rankings can run to hundreds of rows (every channel/video ever requested),
// which made the page tens of thousands of pixels tall on a phone: show the
// top PAGE_SIZE and let the visitor reveal more.
const PAGE_SIZE = 30;

// Tighter cell padding on phones so three/four columns fit a ~360px screen.
const tableSx = { "& .MuiTableCell-root": { px: { xs: 1, sm: 2 } } } as const;

function useShowMore(total: number) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const remaining = total - limit;
  const button =
    remaining > 0 ? (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5 }}>
        <Button size="small" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
          もっと見る (残り{remaining.toLocaleString("ja-JP")}件)
        </Button>
      </Box>
    ) : null;
  return { limit, button };
}

function ChannelTable({
  rows,
  label = "チャンネル",
  storeLinks = false,
}: {
  rows: ChannelStat[];
  label?: string;
  // Add 楽天 search links under each name (used for artists).
  storeLinks?: boolean;
}) {
  const { limit, button } = useShowMore(rows.length);
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        まだデータがありません
      </Typography>
    );
  }
  return (
    <>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={tableSx}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{label}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                リクエスト数
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, limit).map((row, i) => (
              <TableRow key={row.channelTitle}>
                <TableCell>{i + 1}</TableCell>
                <TableCell sx={{ wordBreak: "break-word" }}>
                  <span translate="no">{row.channelTitle}</span>
                  {storeLinks && (
                    <Box sx={{ mt: 0.25 }}>
                      <StoreLinksInline keyword={row.channelTitle} withStreaming />
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right">{row.requestCount.toLocaleString("ja-JP")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {button}
    </>
  );
}

function RequesterTable({ rows }: { rows: RequesterStat[] }) {
  const { limit, button } = useShowMore(rows.length);
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        まだデータがありません
      </Typography>
    );
  }
  return (
    <>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={tableSx}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>名前</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                いいね数
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, limit).map((row, i) => (
              <TableRow key={row.name}>
                <TableCell>{i + 1}</TableCell>
                <TableCell sx={{ wordBreak: "break-word" }} translate="no">{row.name}</TableCell>
                <TableCell align="right">{row.totalLikes.toLocaleString("ja-JP")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {button}
    </>
  );
}

function VideoTable({
  rows,
  valueKey,
  valueLabel,
}: {
  rows: VideoStat[];
  valueKey: "requestCount" | "totalLikes" | "totalCancelVotes" | "totalSuberu";
  valueLabel: string;
}) {
  const { limit, button } = useShowMore(rows.length);
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        まだデータがありません
      </Typography>
    );
  }
  // The channel column is folded under the title below sm: four columns don't
  // fit a phone without squeezing the title into a few characters per line.
  const channelCellSx = { wordBreak: "break-word", display: { xs: "none", sm: "table-cell" } } as const;
  return (
    <>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={tableSx}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>動画</TableCell>
              <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>チャンネル</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                {valueLabel}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, limit).map((row, i) => (
              <TableRow key={`${row.platform}:${row.videoId}`}>
                <TableCell>{i + 1}</TableCell>
                <TableCell sx={{ wordBreak: "break-word" }}>
                  {(() => {
                    const url = videoUrl(row.platform, row.videoId);
                    return url ? (
                      <a className="stats-link" href={url} target="_blank" rel="noopener noreferrer" translate="no">
                        {row.title}
                      </a>
                    ) : (
                      <span translate="no">{row.title}</span>
                    );
                  })()}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: { xs: "block", sm: "none" }, wordBreak: "break-word" }}
                    translate="no"
                  >
                    {row.channelTitle}
                  </Typography>
                  <Box sx={{ mt: 0.25 }}>
                    <StoreLinksInline keyword={searchKeyword(row.title)} withStreaming />
                  </Box>
                </TableCell>
                <TableCell sx={channelCellSx} translate="no">{row.channelTitle}</TableCell>
                <TableCell align="right">{(row[valueKey] ?? 0).toLocaleString("ja-JP")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {button}
    </>
  );
}
