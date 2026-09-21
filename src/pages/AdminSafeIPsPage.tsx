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
import DeleteIcon from "@mui/icons-material/Delete";
import { api } from "../api";
import type { SafeIP } from "../types";

// セーフIP管理画面 (/admin/safeips): ここに登録したIPは、BAN中であってもリクエスト・
// 評価(いいね/bad)・チャットなどを通し、VPN判定や自動BANの対象にもならない
// (backend/internal/safeip)。すでにあるBANの記録は消えず、セーフIPの間だけ無効になる。
function AdminSafeIPsPage() {
  const [entries, setEntries] = useState<SafeIP[]>([]);
  const [bannedIPs, setBannedIPs] = useState<Set<string>>(new Set());
  const [ip, setIP] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setEntries(await api.adminListSafeIPs());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
    // BAN中かどうかの表示用。失敗しても一覧には影響しない。
    api
      .adminListBans()
      .then((bans) => setBannedIPs(new Set(bans.map((b) => b.ip))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = ip.trim();
    if (!value) return;
    try {
      await api.adminAddSafeIP(value, note.trim());
      setIP("");
      setNote("");
      setErrorMessage(null);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleRemove = async (target: string) => {
    try {
      await api.adminRemoveSafeIP(target);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          セーフIPを追加
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          登録したIPは、BAN中であってもリクエストや評価(いいね・bad)、チャットを通します。VPN判定や自動BAN(操作の多さ・端末の異常・複数端末など)の対象にもなりません。すでにBANされている場合、BANの記録は残りますが、セーフIPの間は無効になります。禁止ワードを含む動画のリクエストは、従来どおり拒否されます。
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="IPアドレス" value={ip} onChange={(e) => setIP(e.target.value)} size="small" fullWidth />
            <TextField
              label="メモ(任意)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ whiteSpace: "nowrap" }}>
              追加
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          セーフIP一覧 {entries.length > 0 && `(${entries.length})`}
        </Typography>
        {entries.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">セーフIPはありません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {entries.map((e, i) => (
                <ListItem
                  key={e.ip}
                  divider={i < entries.length - 1}
                  secondaryAction={
                    <Tooltip title="削除">
                      <IconButton edge="end" onClick={() => handleRemove(e.ip)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    sx={{ pr: 6 }}
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                        <span>{e.ip}</span>
                        {bannedIPs.has(e.ip) && (
                          <Chip label="BAN記録あり(無効中)" color="warning" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                        )}
                      </Stack>
                    }
                    secondary={`${e.note ? `${e.note} ・ ` : ""}追加: ${new Date(e.addedAt).toLocaleString("ja-JP")}`}
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

export default AdminSafeIPsPage;
