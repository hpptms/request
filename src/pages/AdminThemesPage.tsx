import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from "@mui/icons-material/Event";
import TodayIcon from "@mui/icons-material/Today";
import { api } from "../api";
import { visibleInterval } from "../lib/visibleInterval";
import type { AdminThemes, Theme, TodayTheme } from "../types";

// Mirrors backend theme.MaxTextRunes.
const MAX_LENGTH = 40;

// Circled slot numbers, as shown on the board's theme box.
const SLOT_MARKS = "①②③④";

// テーマ管理画面 (/admin/themes): 今日のテーマの候補を追加し、ユーザーからの
// 提案を承認/却下する。毎日(JST)、承認済みのテーマから選ばれた回数が
// 最も少ないものの中でランダムに2つ(別々のテーマ)が選ばれる(backend/internal/theme)。
// 翌日のテーマは1日前に予約として選ばれるので、ここで確認・差し替えできる。
function AdminThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [today, setToday] = useState<TodayTheme[]>([]);
  const [next, setNext] = useState<TodayTheme[]>([]);
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The theme-list button whose "which slot?" menu is open.
  const [slotMenu, setSlotMenu] = useState<{ anchor: HTMLElement; theme: Theme; day: "today" | "next" } | null>(null);

  const apply = ({ themes, today, next }: AdminThemes) => {
    setThemes(themes);
    setToday(today ?? []);
    setNext(next ?? []);
  };

  const run = useCallback(async (action: () => Promise<AdminThemes>, failure: string) => {
    try {
      apply(await action());
      setErrorMessage(null);
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : failure);
      return false;
    }
  }, []);

  // Re-polled so a suggestion sent while this tab is open shows up without
  // reloading it.
  useEffect(() => {
    run(api.adminListThemes, "取得に失敗しました");
    return visibleInterval(() => {
      api.adminListThemes().then(apply).catch(() => {});
    }, 15000);
  }, [run]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    if (await run(() => api.adminAddTheme(value), "追加に失敗しました")) setText("");
  };

  const pending = themes.filter((t) => t.status === "pending");
  const approved = themes.filter((t) => t.status === "approved");
  // The current round is whichever pick count is lowest among approved
  // themes; those still at it are next in line.
  const minPicks = approved.length > 0 ? Math.min(...approved.map((t) => t.pickCount)) : 0;
  const remaining = approved.filter((t) => t.pickCount === minPicks).length;
  const isToday = (id: number) => today.some((d) => d.text && d.themeId === id);
  const isNext = (id: number) => next.some((d) => d.text && d.themeId === id);
  const nextDate = next.find((d) => d.text)?.date;

  const chooseSlot = (slot: number) => {
    if (!slotMenu) return;
    const { theme, day } = slotMenu;
    setSlotMenu(null);
    run(
      () => (day === "today" ? api.adminSetTodayTheme(theme.id, slot) : api.adminSetNextTheme(theme.id, slot)),
      "設定に失敗しました",
    );
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          今日のテーマ
        </Typography>
        <ThemeSlots
          days={today}
          disabled={approved.length === 0}
          onRedraw={(slot) => run(() => api.adminRedrawTheme(slot), "引き直しに失敗しました")}
        />
        <Typography variant="body2" color="text.secondary">
          毎日(日本時間の朝8時で切り替え)、承認済みのテーマからランダムに2つ(別々のテーマ)選ばれ、掲示板と再生画面の曲名の上に並べて表示されます。まだ選ばれていないテーマが優先され、全て選ばれると{minPicks + 1}周目の抽選になります(この周の残り: {remaining}件)。
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          明日のテーマ{nextDate && ` (${formatThemeDate(nextDate)} 朝8時から)`}
        </Typography>
        <ThemeSlots
          days={next}
          disabled={approved.length === 0}
          onRedraw={(slot) => run(() => api.adminRedrawNextTheme(slot), "引き直しに失敗しました")}
        />
        <Typography variant="body2" color="text.secondary">
          明日のテーマはあらかじめ選ばれていて、明日の朝8時にそのまま今日のテーマになります。差し替えたい場合は引き直すか、テーマ一覧の
          <EventIcon fontSize="inherit" sx={{ verticalAlign: "middle", mx: 0.25 }} />
          ボタンで指定してください。
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          テーマを追加
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="テーマ"
              value={text}
              onChange={(e) => setText(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
            />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={!text.trim()} sx={{ whiteSpace: "nowrap" }}>
              追加
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          ユーザーからの提案 {pending.length > 0 && `(${pending.length})`}
        </Typography>
        {pending.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">承認待ちの提案はありません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {pending.map((t, i) => (
                <ListItem
                  key={t.id}
                  divider={i < pending.length - 1}
                  secondaryAction={
                    <Stack direction="row">
                      <Tooltip title="承認">
                        <IconButton color="success" onClick={() => run(() => api.adminApproveTheme(t.id), "承認に失敗しました")}>
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="却下(削除)">
                        <IconButton edge="end" onClick={() => run(() => api.adminDeleteTheme(t.id), "却下に失敗しました")}>
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    sx={{ pr: 11, wordBreak: "break-word" }}
                    primary={t.text}
                    secondary={`${t.submitterIp ? `${t.submitterIp} ・ ` : ""}${new Date(t.createdAt).toLocaleString("ja-JP")}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          テーマ一覧 {approved.length > 0 && `(${approved.length})`}
        </Typography>
        {approved.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">テーマはありません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {approved.map((t, i) => (
                <ListItem
                  key={t.id}
                  divider={i < approved.length - 1}
                  secondaryAction={
                    <Stack direction="row">
                      <Tooltip title="明日のテーマにする">
                        <span>
                          <IconButton
                            disabled={isNext(t.id)}
                            onClick={(e) => setSlotMenu({ anchor: e.currentTarget, theme: t, day: "next" })}
                          >
                            <EventIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="今日のテーマにする">
                        <span>
                          <IconButton
                            disabled={isToday(t.id)}
                            onClick={(e) => setSlotMenu({ anchor: e.currentTarget, theme: t, day: "today" })}
                          >
                            <TodayIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton edge="end" onClick={() => run(() => api.adminDeleteTheme(t.id), "削除に失敗しました")}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    sx={{ pr: 16, wordBreak: "break-word" }}
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                        <span>{t.text}</span>
                        {isToday(t.id) && <Chip label="今日" color="primary" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />}
                        {isNext(t.id) && <Chip label="明日" color="secondary" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />}
                        {t.source === "user" && <Chip label="ユーザー提案" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />}
                      </Stack>
                    }
                    secondary={`選ばれた回数: ${t.pickCount}回${t.pickCount === minPicks ? "(この周の候補)" : ""}${
                      t.lastPickedAt ? ` ・ 最後: ${new Date(t.lastPickedAt).toLocaleDateString("ja-JP")}` : ""
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      <Menu anchorEl={slotMenu?.anchor} open={slotMenu !== null} onClose={() => setSlotMenu(null)}>
        {(slotMenu?.day === "next" ? next : today).map((d, slot) => (
          <MenuItem key={slot} onClick={() => chooseSlot(slot)}>
            {SLOT_MARKS[slot]} {d.text ? `「${d.text}」と差し替え` : "に設定"}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}

// One day's themes, one row per slot, each with its own redraw button.
function ThemeSlots({ days, disabled, onRedraw }: { days: TodayTheme[]; disabled: boolean; onRedraw: (slot: number) => void }) {
  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      {days.map((d, slot) => (
        <Stack key={slot} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography variant="h5" color="text.secondary" sx={{ flexShrink: 0 }}>
            {SLOT_MARKS[slot]}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1, minWidth: 0, wordBreak: "break-word" }}>
            {d.text || "候補のテーマがありません"}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CasinoIcon />}
            disabled={disabled}
            onClick={() => onRedraw(slot)}
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            引き直す
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}

// "2026-10-01" -> "10/1(木)"
function formatThemeDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = "日月火水木金土"[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${weekday})`;
}

export default AdminThemesPage;
