import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
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
import TodayIcon from "@mui/icons-material/Today";
import { api } from "../api";
import { visibleInterval } from "../lib/visibleInterval";
import type { Theme, TodayTheme } from "../types";

// Mirrors backend theme.MaxTextRunes.
const MAX_LENGTH = 40;

// テーマ管理画面 (/admin/themes): 今日のテーマの候補を追加し、ユーザーからの
// 提案を承認/却下する。毎日(JST)、承認済みのテーマから選ばれた回数が
// 最も少ないものの中でランダムに1つが選ばれる(backend/internal/theme)。
function AdminThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [today, setToday] = useState<TodayTheme | null>(null);
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apply = ({ themes, today }: { themes: Theme[]; today: TodayTheme }) => {
    setThemes(themes);
    setToday(today.text ? today : null);
  };

  const run = useCallback(async (action: () => Promise<{ themes: Theme[]; today: TodayTheme }>, failure: string) => {
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

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          今日のテーマ
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, wordBreak: "break-word" }}>
          {today ? today.text : "承認済みのテーマがありません"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          毎日(日本時間の朝8時で切り替え)、承認済みのテーマからランダムに1つ選ばれ、再生画面の曲名の上に曲名と同じ時間だけ表示されます。まだ選ばれていないテーマが優先され、全て選ばれると{minPicks + 1}周目の抽選になります(この周の残り: {remaining}件)。
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CasinoIcon />}
          disabled={approved.length === 0}
          onClick={() => run(api.adminRedrawTheme, "引き直しに失敗しました")}
        >
          今日のテーマを引き直す
        </Button>
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
                      <Tooltip title="今日のテーマにする">
                        <span>
                          <IconButton
                            disabled={today?.themeId === t.id}
                            onClick={() => run(() => api.adminSetTodayTheme(t.id), "設定に失敗しました")}
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
                    sx={{ pr: 11, wordBreak: "break-word" }}
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                        <span>{t.text}</span>
                        {today?.themeId === t.id && <Chip label="今日" color="primary" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />}
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
    </Stack>
  );
}

export default AdminThemesPage;
