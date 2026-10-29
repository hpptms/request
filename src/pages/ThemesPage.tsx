import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { api } from "../api";
import { ContentPageLayout } from "../components/ContentPageLayout";
import { useTodayTheme } from "../lib/useTodayTheme";
import { usePageSeo } from "../lib/useSeo";
import { visibleInterval } from "../lib/visibleInterval";
import type { PastTheme, ThemeBallot } from "../types";

// Re-polled so others' votes (and the 5:00 close) show up without reloading.
const POLL_INTERVAL_MS = 30000;

// How many past days the history shows before "もっと見る".
const HISTORY_DAYS = 14;

// 今日のテーマの投票と採用履歴 (/themes)。翌日のテーマは、まだ選ばれていない
// テーマの中からユーザーの投票で決まる(締切は当日朝5時、切り替えは朝8時 —
// backend/internal/theme)。履歴は、一周して同じテーマがまた候補に戻ってきた
// ときに、前回いつ採用されたかを確かめられるように。
function ThemesPage() {
  usePageSeo("/themes");
  const todayThemes = useTodayTheme();
  const [ballot, setBallot] = useState<ThemeBallot | null>(null);
  const [history, setHistory] = useState<PastTheme[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(() => {
    api
      .getThemeBallot()
      .then(setBallot)
      .catch(() => {});
    api
      .getThemeHistory()
      .then(({ history }) => setHistory(history ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    return visibleInterval(load, POLL_INTERVAL_MS);
  }, [load]);

  const vote = async (id: number) => {
    if (!ballot) return;
    setSending(true);
    setError(null);
    try {
      // Tapping your own vote again withdraws it.
      setBallot(await api.voteTheme(ballot.myVote === id ? 0 : id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "投票に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const days = groupByDate(history);
  const shownDays = showAll ? days : days.slice(0, HISTORY_DAYS);
  const totalVotes = ballot?.options.reduce((sum, o) => sum + o.votes, 0) ?? 0;

  return (
    <ContentPageLayout
      title="テーマ投票"
      lead="「今日のテーマ」は、まだ採用されていないテーマの中からみんなの投票で決まります。1人1票、締切までは何度でも変更できます。"
    >
      <Box component="section">
        <SectionHeading icon={<LightbulbIcon sx={{ color: "#FF9A3C" }} />}>今日のテーマ</SectionHeading>
        <ThemeList texts={todayThemes} empty="準備中" />
      </Box>

      {ballot?.tomorrow && ballot.tomorrow.length > 0 && (
        <Box component="section">
          <SectionHeading icon={<CheckCircleIcon color="success" />}>明日のテーマ(決定)</SectionHeading>
          <ThemeList texts={ballot.tomorrow} empty="" />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            朝8時に今日のテーマに切り替わります
          </Typography>
        </Box>
      )}

      <Box component="section">
        <SectionHeading icon={<HowToVoteIcon color="primary" />}>
          {ballot ? `${formatThemeDate(ballot.date)}のテーマを投票` : "テーマを投票"}
        </SectionHeading>
        {ballot && ballot.open > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.8 }}>
            締切: {formatDeadline(ballot.closesAt)} ・ 得票数の上位{ballot.open}つが採用されます
            {ballot.open < 2 && "(もう1つは管理者が決定済み)"}
            。票が入らなかった枠は抽選で決まります。
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        {!ballot ? null : ballot.open === 0 ? (
          <Alert severity="info">この日のテーマは管理者が決定済みです</Alert>
        ) : ballot.options.length === 0 ? (
          <Alert severity="info">投票できるテーマがありません</Alert>
        ) : (
          <Stack spacing={1}>
            {ballot.options.map((o) => {
              const mine = ballot.myVote === o.id;
              const share = totalVotes > 0 ? o.votes / totalVotes : 0;
              return (
                <ButtonBase
                  key={o.id}
                  disabled={sending}
                  onClick={() => vote(o.id)}
                  aria-pressed={mine}
                  sx={{ display: "block", width: "100%", textAlign: "left", borderRadius: 1 }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      px: 1.5,
                      py: 1.25,
                      borderColor: mine ? "primary.main" : undefined,
                      borderWidth: mine ? 2 : 1,
                    }}
                  >
                    {/* Vote share bar behind the text. */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: `${share * 100}%`,
                        bgcolor: mine ? "primary.main" : "action.selected",
                        opacity: mine ? 0.15 : 1,
                        transition: "width 0.3s",
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ position: "relative", alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1, minWidth: 0, wordBreak: "break-word" }}>
                        {o.text}
                      </Typography>
                      {mine && <Chip label="投票済み" color="primary" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />}
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, flexShrink: 0, minWidth: "3em", textAlign: "right" }}>
                        {o.votes}票
                      </Typography>
                    </Stack>
                  </Paper>
                </ButtonBase>
              );
            })}
            <Typography variant="caption" color="text.secondary">
              タップで投票、もう一度タップで取り消し。別のテーマをタップすると投票先を変更できます。
            </Typography>
          </Stack>
        )}
      </Box>

      <Box component="section">
        <SectionHeading>採用されたテーマ</SectionHeading>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.8 }}>
          全てのテーマが一度ずつ採用されると、また全テーマが投票の候補に戻ります。
        </Typography>
        {days.length === 0 ? (
          <Typography color="text.secondary">まだ履歴はありません</Typography>
        ) : (
          <Paper variant="outlined">
            {shownDays.map(([date, themes], i) => (
              <Stack
                key={date}
                direction="row"
                spacing={1.5}
                sx={{ px: 1.5, py: 1, borderTop: i > 0 ? 1 : 0, borderColor: "divider", alignItems: "baseline" }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, width: "5.5em" }}>
                  {formatThemeDate(date)}
                </Typography>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  {themes.map((t) => (
                    <Typography key={t.slot} variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
                      {t.text}
                      {t.votes > 0 && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
                          投票 {t.votes}票
                        </Typography>
                      )}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            ))}
          </Paper>
        )}
        {!showAll && days.length > HISTORY_DAYS && (
          <Button size="small" onClick={() => setShowAll(true)} sx={{ mt: 1 }}>
            もっと見る({days.length - HISTORY_DAYS}日分)
          </Button>
        )}
      </Box>
    </ContentPageLayout>
  );
}

function SectionHeading({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
      {icon}
      <Typography variant="h6" component="h2">
        {children}
      </Typography>
    </Stack>
  );
}

function ThemeList({ texts, empty }: { texts: string[]; empty: string }) {
  if (texts.length === 0) return <Typography color="text.secondary">{empty}</Typography>;
  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.25 }}>
      <Stack spacing={0.5}>
        {texts.map((text, i) => (
          <Stack key={i} direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#FF9A3C", flexShrink: 0 }}>
              {"①②③④"[i] ?? `${i + 1}.`}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, minWidth: 0, wordBreak: "break-word" }}>
              {text}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

// history (newest first) as [date, that day's themes in slot order] pairs.
function groupByDate(history: PastTheme[]): [string, PastTheme[]][] {
  const out: [string, PastTheme[]][] = [];
  for (const t of history) {
    const last = out[out.length - 1];
    if (last && last[0] === t.date) last[1].push(t);
    else out.push([t.date, [t]]);
  }
  for (const [, themes] of out) themes.sort((a, b) => a.slot - b.slot);
  return out;
}

// "2026-10-01" -> "10/1(木)"
function formatThemeDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = "日月火水木金土"[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${weekday})`;
}

// The close time in JST, e.g. "10/30(金) 5:00".
function formatDeadline(iso: string): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")}/${get("day")}(${get("weekday")}) ${get("hour")}:${get("minute")}`;
}

export default ThemesPage;
