import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import BlockIcon from "@mui/icons-material/Block";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { api } from "../api";
import type { AdminVideoRequest, BannedIP } from "../types";

// この件数以上のキャンセル投票(BAD投票)がその送信元IPのリクエスト全体で
// 累積していたら「要注意ユーザー」として警告表示する。CancelVoteThreshold
// (backend/internal/store/store.go)と同じ5を流用しているが、こちらは
// 1件のリクエストではなく複数リクエストにまたがる累計なので別の定数として
// 持たせている。
const SUSPICIOUS_CANCEL_VOTES_THRESHOLD = 5;

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  playing: "再生中",
  done: "再生済み",
};

// BAN management screen (/admin, index route): ban/unban IPs by hand, and
// ban directly from a recent requester's history.
function AdminBansPage() {
  const [requests, setRequests] = useState<AdminVideoRequest[]>([]);
  const [bans, setBans] = useState<BannedIP[]>([]);
  const [manualIP, setManualIP] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Which flagged IP's request history is currently expanded (see
  // suspiciousUsers below); null = all collapsed.
  const [expandedIP, setExpandedIP] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [requestsData, bansData] = await Promise.all([api.adminListRequests(), api.adminListBans()]);
      setRequests(requestsData);
      setBans(bansData);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const bannedIPs = new Set(bans.map((b) => b.ip));

  const handleBan = async (ip: string) => {
    try {
      await api.adminBanIP(ip);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "BANに失敗しました");
    }
  };

  const handleUnban = async (ip: string) => {
    try {
      await api.adminUnbanIP(ip);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "解除に失敗しました");
    }
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    const ip = manualIP.trim();
    if (!ip) return;
    await handleBan(ip);
    setManualIP("");
  };

  // Most recent requester per IP, so the admin can tell who they'd be banning.
  const recentRequesterByIP = new Map<string, AdminVideoRequest>();
  for (const r of requests) {
    if (!r.requesterIP) continue;
    const existing = recentRequesterByIP.get(r.requesterIP);
    if (!existing || r.createdAt > existing.createdAt) {
      recentRequesterByIP.set(r.requesterIP, r);
    }
  }
  const uniqueRequesterIPs = [...recentRequesterByIP.entries()].sort(
    (a, b) => (a[1].createdAt < b[1].createdAt ? 1 : -1),
  );

  // Every request grouped by requester IP (newest first), so both the
  // cancel-vote total and the full history below can be derived from it.
  // Note: only requests still in this server process's memory since its
  // last restart are included here — done requests aren't persisted to
  // disk (see store.Store.SaveToFile), so history older than that is gone.
  const requestsByIP = new Map<string, AdminVideoRequest[]>();
  for (const r of requests) {
    if (!r.requesterIP) continue;
    const list = requestsByIP.get(r.requesterIP);
    if (list) list.push(r);
    else requestsByIP.set(r.requesterIP, [r]);
  }
  for (const list of requestsByIP.values()) {
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  // IPs whose requests have collectively drawn a lot of cancel votes —
  // flagged for the admin to review (and manually ban if warranted), not
  // banned automatically. Already-banned IPs are excluded since they're
  // already handled in the BAN中のIP list above.
  const suspiciousUsers = [...requestsByIP.entries()]
    .map(([ip, ipRequests]) => ({
      ip,
      totalCancelVotes: ipRequests.reduce((sum, r) => sum + r.cancelVotes, 0),
      requests: ipRequests,
    }))
    .filter((u) => u.totalCancelVotes >= SUSPICIOUS_CANCEL_VOTES_THRESHOLD && !bannedIPs.has(u.ip))
    .sort((a, b) => b.totalCancelVotes - a.totalCancelVotes);

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          IPを指定してBAN
        </Typography>
        <Box component="form" onSubmit={handleManualBan}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="IPアドレス"
              placeholder="例: 192.168.1.23"
              value={manualIP}
              onChange={(e) => setManualIP(e.target.value)}
              size="small"
              fullWidth
            />
            <Button type="submit" variant="contained" color="error" startIcon={<BlockIcon />}>
              BAN
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          BAN中のIP {bans.length > 0 && `(${bans.length})`}
        </Typography>
        {bans.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">BAN中のIPはありません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {bans.map((b, i) => (
                <ListItem
                  key={b.ip}
                  divider={i < bans.length - 1}
                  secondaryAction={
                    <Tooltip title="解除">
                      <IconButton edge="end" onClick={() => handleUnban(b.ip)}>
                        <LockOpenIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    sx={{ pr: 6 }}
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <span>{b.ip}</span>
                        {b.reason && b.reason !== "manual" && (
                          <Chip label="自動BAN" color="warning" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                        )}
                      </Stack>
                    }
                    secondary={
                      `BAN日時: ${new Date(b.bannedAt).toLocaleString("ja-JP")}` +
                      (b.reason && b.reason !== "manual" ? ` (理由: ${b.reason})` : "")
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {suspiciousUsers.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            要注意ユーザー ({suspiciousUsers.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            リクエストへのキャンセル投票(BAD投票)が累計{SUSPICIOUS_CANCEL_VOTES_THRESHOLD}件以上たまっているIPです。BANはこの一覧からは行われず、内容を確認した上で手動で行ってください。
          </Typography>
          <Paper elevation={2}>
            <List disablePadding>
              {suspiciousUsers.map((u, i) => (
                <Box key={u.ip}>
                  <ListItem
                    divider={!(expandedIP === u.ip) && i < suspiciousUsers.length - 1}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="リクエスト履歴">
                          <IconButton
                            edge="end"
                            onClick={() => setExpandedIP(expandedIP === u.ip ? null : u.ip)}
                          >
                            {expandedIP === u.ip ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="このIPをBAN">
                          <IconButton edge="end" color="error" onClick={() => handleBan(u.ip)}>
                            <BlockIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <ListItemText
                      sx={{ pr: 12 }}
                      primary={
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <WarningAmberIcon color="warning" fontSize="small" />
                          <span>{u.ip}</span>
                        </Stack>
                      }
                      secondary={`累計キャンセル投票: ${u.totalCancelVotes}件 / リクエスト${u.requests.length}件`}
                    />
                  </ListItem>
                  <Collapse in={expandedIP === u.ip} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ bgcolor: "action.hover" }}>
                      {u.requests.map((r, j) => (
                        <ListItem key={r.id} divider={j < u.requests.length - 1}>
                          <ListItemAvatar>
                            <Avatar variant="rounded" src={r.thumbnailUrl} sx={{ width: 48, height: 36, mr: 1 }} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={r.title}
                            secondary={
                              `${STATUS_LABELS[r.status] ?? r.status} / ` +
                              `キャンセル投票${r.cancelVotes}件 / ${new Date(r.createdAt).toLocaleString("ja-JP")}`
                            }
                            slotProps={{ primary: { noWrap: true } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                  {expandedIP === u.ip && i < suspiciousUsers.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          最近のリクエスト送信元
        </Typography>
        {uniqueRequesterIPs.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">リクエスト履歴はありません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {uniqueRequesterIPs.map(([ip, r], i) => (
                <ListItem
                  key={ip}
                  divider={i < uniqueRequesterIPs.length - 1}
                  secondaryAction={
                    bannedIPs.has(ip) ? (
                      <Chip label="BAN中" color="error" size="small" />
                    ) : (
                      <Tooltip title="このIPをBAN">
                        <IconButton edge="end" color="error" onClick={() => handleBan(ip)}>
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={r.thumbnailUrl} sx={{ width: 48, height: 36, mr: 1 }} />
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ pr: 6 }}
                    primary={ip}
                    secondary={r.title}
                    slotProps={{ secondary: { noWrap: true } }}
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

export default AdminBansPage;
