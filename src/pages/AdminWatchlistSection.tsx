import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { api } from "../api";
import { visibleInterval } from "../lib/visibleInterval";
import type { Watchlist } from "../types";

// 制限モード (BANタブ /admin 内): 永久BANを解除したうえで、リクエストを
// 厳しくチェックするユーザーの一覧と、制限モード専用の禁止ワード
// (backend/internal/watchlist)。IPに加えて端末指紋でも本人を判定するので、
// 回線を変えても制限は外れない。拒否されたリクエストが strikeLimit 回に
// 達すると自動で永久BANに戻る。
// refreshKey はBAN一覧側で制限モードへ切り替えたときに再取得させるためのもの。
function AdminWatchlistSection({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [data, setData] = useState<Watchlist>({ users: [], keywords: [], strikeLimit: 3 });
  const [keyword, setKeyword] = useState("");
  const [expandedIP, setExpandedIP] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await api.adminGetWatchlist());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    refresh();
    return visibleInterval(refresh, 5000);
  }, [refresh, refreshKey]);

  const handleConvertAll = async () => {
    if (!window.confirm("手動BAN(永久)中のIPをすべて解除し、制限モードに切り替えます。よろしいですか？")) return;
    try {
      const { converted } = await api.adminConvertPermanentBans();
      setMessage(`${converted}件を制限モードに切り替えました`);
      setErrorMessage(null);
      await refresh();
      onChanged();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "切り替えに失敗しました");
    }
  };

  const handleRemove = async (ip: string) => {
    if (!window.confirm(`${ip} の制限モードを解除します(完全に通常ユーザーに戻ります)。よろしいですか？`)) return;
    try {
      await api.adminRemoveWatchlist(ip);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "解除に失敗しました");
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = keyword.trim();
    if (!value) return;
    try {
      await api.adminAddWatchlistKeyword(value);
      setKeyword("");
      setErrorMessage(null);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleRemoveKeyword = async (target: string) => {
    try {
      await api.adminRemoveWatchlistKeyword(target);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          制限モード
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          BANを解除したうえで、リクエストを厳しくチェックします。制限モード用の禁止ワード(タイトル・チャンネル名)、通常の禁止ワード、ブロック中の投稿者、センシティブ・年齢制限のある動画のリクエストは拒否され、違反として数えられます。違反が{data.strikeLimit}回に達すると自動で永久BANに戻ります。本人の判定にはIPに加えて端末指紋も使うため、回線を変えても制限は外れません。
        </Typography>
        <Button variant="contained" color="warning" onClick={handleConvertAll}>
          手動BAN(永久)中のIPをすべて制限モードに切り替え
        </Button>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          制限モード用の禁止ワード {data.keywords.length > 0 && `(${data.keywords.length})`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          制限モードのユーザーにだけ適用されます。動画タイトルかチャンネル名に含まれていると拒否します(大文字・小文字は区別しません)。
        </Typography>
        <Box component="form" onSubmit={handleAddKeyword} sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="ワード" value={keyword} onChange={(e) => setKeyword(e.target.value)} size="small" fullWidth />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ whiteSpace: "nowrap" }}>
              追加
            </Button>
          </Stack>
        </Box>
        {data.keywords.length === 0 ? (
          <Typography color="text.secondary">制限モード用の禁止ワードはありません</Typography>
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
            {data.keywords.map((k) => (
              <Chip key={k} label={k} onDelete={() => handleRemoveKeyword(k)} />
            ))}
          </Stack>
        )}
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          制限モードのユーザー {data.users.length > 0 && `(${data.users.length})`}
        </Typography>
        {data.users.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">制限モードのユーザーはいません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {data.users.map((u, i) => {
                const expanded = expandedIP === u.ip;
                return (
                  <ListItem
                    key={u.ip}
                    divider={i < data.users.length - 1}
                    sx={{ flexDirection: "column", alignItems: "stretch" }}
                  >
                    <Stack direction="row" sx={{ alignItems: "flex-start" }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                            <span>{u.ip}</span>
                            {u.bannedAt ? (
                              <Chip label="再BAN済み" color="error" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                            ) : (
                              <Chip
                                label={`違反 ${u.strikeCount}/${data.strikeLimit}`}
                                color={u.strikeCount > 0 ? "warning" : "default"}
                                size="small"
                                sx={{ height: 18, fontSize: "0.65rem" }}
                              />
                            )}
                            {u.fingerprints.length > 0 && (
                              <Chip
                                label={`端末指紋 ${u.fingerprints.length}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: "0.65rem" }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          `${u.note ? `${u.note} ・ ` : ""}制限開始: ${new Date(u.addedAt).toLocaleString("ja-JP")}` +
                          (u.bannedAt ? ` / 再BAN: ${new Date(u.bannedAt).toLocaleString("ja-JP")}` : "") +
                          (u.linkedIPs.length > 0 ? ` / 端末指紋で紐付いたIP: ${u.linkedIPs.map((l) => l.ip).join(", ")}` : "")
                        }
                      />
                      <Stack direction="row" spacing={0.5}>
                        {u.strikes.length > 0 && (
                          <Tooltip title={expanded ? "違反履歴を閉じる" : "違反履歴を見る"}>
                            <IconButton onClick={() => setExpandedIP(expanded ? null : u.ip)}>
                              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="制限モードを解除">
                          <IconButton onClick={() => handleRemove(u.ip)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Collapse in={expanded} unmountOnExit>
                      <Stack spacing={1} sx={{ mt: 1, pl: 1 }}>
                        {[...u.strikes].reverse().map((st, j) => (
                          <Typography key={j} variant="body2" color="text.secondary">
                            {new Date(st.at).toLocaleString("ja-JP")} ({st.ip}) — {st.reason}
                            {st.title ? `: ${st.title}` : ""}
                            {st.channelTitle ? `（${st.channelTitle}）` : ""}{" "}
                            {st.url && (
                              <Link href={st.url} target="_blank" rel="noopener noreferrer">
                                動画を開く
                              </Link>
                            )}
                          </Typography>
                        ))}
                      </Stack>
                    </Collapse>
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

export default AdminWatchlistSection;
