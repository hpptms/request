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
import PolicyIcon from "@mui/icons-material/Policy";
import { api } from "../api";
import { visibleInterval } from "../lib/visibleInterval";
import type { Watchlist } from "../types";

// 制限モード (BANタブ /admin 内、backend/internal/watchlist): 永久BANを解除した
// ユーザーを見張る。IPと端末指紋で本人を判定し、制限モード用禁止ワード(タイトル・
// チャンネル名)や通常の禁止ワード・センシティブ動画などのリクエストを拒否して
// 違反として数え、strikeLimit回で再び永久BANする。
// version が変わると(BAN一覧から切り替えた直後など)すぐに再取得する。
function AdminWatchlistPage({ version = 0, onChanged }: { version?: number; onChanged?: () => void }) {
  const [data, setData] = useState<Watchlist>({ users: [], keywords: [], strikeLimit: 3 });
  const [keyword, setKeyword] = useState("");
  const [ip, setIP] = useState("");
  const [note, setNote] = useState("");
  const [expandedIP, setExpandedIP] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
  }, [refresh, version]);

  const run = async (fn: () => Promise<unknown>, failure: string) => {
    try {
      await fn();
      setErrorMessage(null);
      await refresh();
      onChanged?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : failure);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = keyword.trim();
    if (!value) return;
    await run(() => api.adminAddWatchlistKeyword(value), "追加に失敗しました");
    setKeyword("");
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = ip.trim();
    if (!value) return;
    await run(() => api.adminAddWatchlist(value, note.trim()), "追加に失敗しました");
    setIP("");
    setNote("");
  };

  const handleConvertAll = async () => {
    if (!window.confirm("永久BAN(手動BAN)中のIPをすべてBAN解除し、制限モードに切り替えます。よろしいですか？")) return;
    await run(async () => {
      const { converted } = await api.adminConvertPermanentBans();
      setInfo(`${converted}件を制限モードに切り替えました`);
    }, "切り替えに失敗しました");
  };

  const handleRemoveUser = async (target: string) => {
    if (!window.confirm(`${target} の制限モードを解除します(BANもされず、通常のユーザーに戻ります)。よろしいですか？`)) return;
    await run(() => api.adminRemoveWatchlist(target), "削除に失敗しました");
  };

  const active = data.users.filter((u) => !u.bannedAt);
  const rebanned = data.users.filter((u) => u.bannedAt);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
          <PolicyIcon color="secondary" /> 制限モード {data.users.length > 0 && `(監視中 ${active.length} / 再BAN ${rebanned.length})`}
        </Typography>
        <Alert severity="info" sx={{ mb: 1.5 }}>
          永久BANを解除し、リクエストを監視するモードです。IPアドレスに加えて端末指紋でも本人を判定するため、回線を変えても制限は続きます(同じ端末で別のIPが{" "}
          5件まで自動で紐付きます)。制限モード用禁止ワード(動画タイトル・チャンネル名、大文字小文字を区別しない)、通常の禁止ワード、ブロック中の投稿者、センシティブ・年齢制限のある動画をリクエストすると拒否され、違反として数えられます。違反が
          {data.strikeLimit}回になると自動で再び永久BANされます。
        </Alert>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {errorMessage}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setInfo(null)}>
            {info}
          </Alert>
        )}

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Button variant="contained" color="secondary" startIcon={<PolicyIcon />} onClick={handleConvertAll} sx={{ alignSelf: "flex-start" }}>
              永久BAN中のIPをすべて制限モードに切り替え
            </Button>
            <Box component="form" onSubmit={handleAddUser}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="IPアドレスを指定して追加" value={ip} onChange={(e) => setIP(e.target.value)} size="small" fullWidth />
                <TextField
                  label="メモ(任意)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
                <Button type="submit" variant="outlined" startIcon={<AddIcon />} sx={{ whiteSpace: "nowrap" }}>
                  追加
                </Button>
              </Stack>
            </Box>
            <Typography variant="caption" color="text.secondary">
              BAN中のIPを追加した場合はBANが解除されます。
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          制限モード用禁止ワード {data.keywords.length > 0 && `(${data.keywords.length})`}
        </Typography>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component="form" onSubmit={handleAddKeyword} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="ワード(タイトル・チャンネル名に含まれていたら拒否)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                size="small"
                fullWidth
              />
              <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ whiteSpace: "nowrap" }}>
                追加
              </Button>
            </Stack>
          </Box>
          {data.keywords.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              ワードはまだありません
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              {data.keywords.map((k) => (
                <Chip
                  key={k}
                  label={k}
                  onDelete={() => run(() => api.adminRemoveWatchlistKeyword(k), "削除に失敗しました")}
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          制限モードのユーザー
        </Typography>
        {data.users.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">制限モードのユーザーはいません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {[...active, ...rebanned].map((u, i, all) => {
                const expanded = expandedIP === u.ip;
                return (
                  <ListItem
                    key={u.ip}
                    divider={i < all.length - 1}
                    sx={{ alignItems: "flex-start" }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={expanded ? "閉じる" : "詳細"}>
                          <IconButton onClick={() => setExpandedIP(expanded ? null : u.ip)}>
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="制限モードから外す">
                          <IconButton edge="end" onClick={() => handleRemoveUser(u.ip)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <ListItemText
                      sx={{ pr: 11 }}
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
                          {u.linkedIPs.length > 0 && (
                            <Chip label={`別IP ${u.linkedIPs.length}`} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          {`制限開始: ${new Date(u.addedAt).toLocaleString("ja-JP")}`}
                          {u.bannedAt && ` / 再BAN: ${new Date(u.bannedAt).toLocaleString("ja-JP")}`}
                          {u.note && ` ・ ${u.note}`}
                          {` ・ 端末指紋 ${u.fingerprints.length}件`}
                          <Collapse in={expanded} timeout="auto" unmountOnExit component="span">
                            <Box component="span" sx={{ display: "block", mt: 1 }}>
                              {u.banReason && (
                                <Box component="span" sx={{ display: "block" }}>
                                  元のBAN理由: {u.banReason === "manual" ? "手動BAN" : u.banReason}
                                </Box>
                              )}
                              {u.linkedIPs.length > 0 && (
                                <Box component="span" sx={{ display: "block" }}>
                                  同じ端末で使われた別のIP:{" "}
                                  {u.linkedIPs.map((l) => `${l.ip} (${new Date(l.linkedAt).toLocaleString("ja-JP")})`).join("、")}
                                </Box>
                              )}
                              {u.strikes.length === 0 ? (
                                <Box component="span" sx={{ display: "block" }}>
                                  違反はまだありません
                                </Box>
                              ) : (
                                [...u.strikes].reverse().map((s, j) => (
                                  <Box component="span" key={j} sx={{ display: "block" }}>
                                    {new Date(s.at).toLocaleString("ja-JP")} [{s.ip}] {s.reason}
                                    {s.title && ` — ${s.title}`}
                                    {s.channelTitle && `（${s.channelTitle}）`}{" "}
                                    {s.url && (
                                      <Link href={s.url} target="_blank" rel="noopener noreferrer">
                                        動画を開く
                                      </Link>
                                    )}
                                  </Box>
                                ))
                              )}
                            </Box>
                          </Collapse>
                        </>
                      }
                    />
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

export default AdminWatchlistPage;
