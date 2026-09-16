import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
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
import DevicesIcon from "@mui/icons-material/Devices";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import TimerIcon from "@mui/icons-material/Timer";
import VpnLockIcon from "@mui/icons-material/VpnLock";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { api } from "../api";
import type {
  AdminVideoRequest,
  BannedIP,
  MultiDeviceIP,
  RecentBadVoter,
  SuspiciousFingerprint,
  VoteOnlyVoter,
} from "../types";

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

// Matches backend/internal/devicemix.ClassifyUserAgent's two buckets.
const DEVICE_CLASS_LABELS: Record<string, string> = {
  desktop: "PC",
  mobile: "スマホ",
};

// Two ban actions shown side by side wherever the admin can ban an IP from
// this page: a permanent ban (解除するまで継続) and a 1-hour ban that
// backend/internal/banlist.List.StartExpirySweep lifts automatically.
// Rendered as a fragment (not wrapped in its own Stack) so callers can drop
// it straight into their existing action Stack alongside other buttons
// (expand, etc.).
function BanButtons({
  ip,
  onBan,
  size = "medium",
}: {
  ip: string;
  onBan: (ip: string, temporary: boolean) => void;
  size?: "small" | "medium";
}) {
  return (
    <>
      <Tooltip title="手動BAN(解除するまで継続)">
        <IconButton edge="end" color="error" size={size} onClick={() => onBan(ip, false)}>
          <BlockIcon fontSize={size} />
        </IconButton>
      </Tooltip>
      <Tooltip title="1時間BAN(自動解除)">
        <IconButton edge="end" color="warning" size={size} onClick={() => onBan(ip, true)}>
          <TimerIcon fontSize={size} />
        </IconButton>
      </Tooltip>
    </>
  );
}

// BAN management screen (/admin, index route): ban/unban IPs by hand, and
// ban directly from a recent requester's history.
function AdminBansPage() {
  const [requests, setRequests] = useState<AdminVideoRequest[]>([]);
  const [bans, setBans] = useState<BannedIP[]>([]);
  const [suspiciousFingerprints, setSuspiciousFingerprints] = useState<SuspiciousFingerprint[]>([]);
  const [voteOnlyVoters, setVoteOnlyVoters] = useState<VoteOnlyVoter[]>([]);
  const [recentBadVoters, setRecentBadVoters] = useState<RecentBadVoter[]>([]);
  const [multiDeviceIPs, setMultiDeviceIPs] = useState<MultiDeviceIP[]>([]);
  const [manualIP, setManualIP] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Which flagged IP's request history is currently expanded (see
  // suspiciousUsers below); null = all collapsed.
  const [expandedIP, setExpandedIP] = useState<string | null>(null);
  // Same idea, but for which recent-bad-voter IP's voted-on videos are
  // expanded (see recentBadVoteUsers below) — kept separate from
  // expandedIP so expanding an IP in one section doesn't also expand it
  // in the other.
  const [expandedBadVoteIP, setExpandedBadVoteIP] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // Promise.allSettled rather than Promise.all: these calls are independent,
    // and the backend (a separately-deployed, manually-updated service — see
    // CLAUDE.md) can briefly lag behind the frontend after a deploy, e.g.
    // missing a just-added endpoint like recent-bad-voters. One 404 shouldn't
    // blank out lists (BAN中のIP, 最近のリクエスト送信元, ...) that the
    // backend can serve just fine.
    const [
      requestsResult,
      bansResult,
      fingerprintsResult,
      voteOnlyVotersResult,
      recentBadVotersResult,
      multiDeviceIPsResult,
    ] = await Promise.allSettled([
      api.adminListRequests(),
      api.adminListBans(),
      api.adminListSuspiciousFingerprints(),
      api.adminListVoteOnlyVoters(),
      api.adminListRecentBadVoters(),
      api.adminListMultiDeviceIPs(),
    ]);
    if (requestsResult.status === "fulfilled") setRequests(requestsResult.value);
    if (bansResult.status === "fulfilled") setBans(bansResult.value);
    if (fingerprintsResult.status === "fulfilled") setSuspiciousFingerprints(fingerprintsResult.value);
    if (voteOnlyVotersResult.status === "fulfilled") setVoteOnlyVoters(voteOnlyVotersResult.value);
    if (recentBadVotersResult.status === "fulfilled") setRecentBadVoters(recentBadVotersResult.value);
    if (multiDeviceIPsResult.status === "fulfilled") setMultiDeviceIPs(multiDeviceIPsResult.value);

    const firstFailure = [
      requestsResult,
      bansResult,
      fingerprintsResult,
      voteOnlyVotersResult,
      recentBadVotersResult,
      multiDeviceIPsResult,
    ].find((r): r is PromiseRejectedResult => r.status === "rejected");
    setErrorMessage(
      firstFailure
        ? firstFailure.reason instanceof Error
          ? firstFailure.reason.message
          : "取得に失敗しました"
        : null,
    );
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const bannedIPs = new Set(bans.map((b) => b.ip));

  const handleBan = async (ip: string, temporary = false) => {
    try {
      await api.adminBanIP(ip, temporary);
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

  const handleManualBan = async (temporary: boolean) => {
    const ip = manualIP.trim();
    if (!ip) return;
    await handleBan(ip, temporary);
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

  // IPs that have cast a cancel vote (BAD投票) but never submitted a request
  // themselves — already-banned IPs excluded since they're already handled
  // in the BAN中のIP list above.
  const voteOnlyUsers = voteOnlyVoters.filter((v) => !bannedIPs.has(v.ip));

  // IPs that have cast a cancel vote (BAD投票) within the last few minutes
  // (server-side windowed — see RecentBadVoteWindow), including IPs that
  // have also submitted requests themselves — already-banned IPs excluded
  // since they're already handled in the BAN中のIP list above.
  const recentBadVoteUsers = recentBadVoters.filter((v) => !bannedIPs.has(v.ip));

  // IPs currently sighted with more than one device class (desktop vs.
  // mobile) — likely more than one physical device sharing a network —
  // already-banned IPs excluded since they're already handled in the
  // BAN中のIP list above.
  const multiDeviceUsers = multiDeviceIPs.filter((d) => !bannedIPs.has(d.ip));

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          IPを指定してBAN
        </Typography>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleManualBan(false);
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="IPアドレス"
              placeholder="例: 192.168.1.23"
              value={manualIP}
              onChange={(e) => setManualIP(e.target.value)}
              size="small"
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <Button
                type="submit"
                variant="contained"
                color="error"
                startIcon={<BlockIcon />}
                sx={{ whiteSpace: "nowrap" }}
              >
                手動BAN
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="warning"
                startIcon={<TimerIcon />}
                onClick={() => handleManualBan(true)}
                sx={{ whiteSpace: "nowrap" }}
              >
                1時間BAN
              </Button>
            </Stack>
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
                        {b.expiresAt ? (
                          <Chip label="1時間BAN" color="info" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                        ) : (
                          b.reason &&
                          b.reason !== "manual" && (
                            <Chip label="自動BAN" color="warning" size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                          )
                        )}
                      </Stack>
                    }
                    secondary={
                      <>
                        {`BAN日時: ${new Date(b.bannedAt).toLocaleString("ja-JP")}` +
                          (b.expiresAt
                            ? ` / 自動解除: ${new Date(b.expiresAt).toLocaleString("ja-JP")}`
                            : "") +
                          (b.reason && b.reason !== "manual" && b.reason !== "manual-1h"
                            ? ` (理由: ${b.reason})`
                            : "")}
                        {b.request && (
                          <>
                            <br />
                            リクエスト内容: {b.request.title}
                            {b.request.channelTitle ? `（${b.request.channelTitle}）` : ""}
                            {b.request.matchedKeyword
                              ? ` — 禁止ワード「${b.request.matchedKeyword}」に一致`
                              : ""}{" "}
                            <Link href={b.request.url} target="_blank" rel="noopener noreferrer">
                              動画を開く
                            </Link>
                          </>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {recentBadVoteUsers.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            直近10分以内にBADを押したIP ({recentBadVoteUsers.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            過去10分以内にキャンセル投票(BAD投票)を行ったIPです。BANはこの一覧からは行われず、内容を確認した上で手動で行ってください。
          </Typography>
          <Paper elevation={2}>
            <List disablePadding>
              {recentBadVoteUsers.map((v, i) => (
                <Box key={v.ip}>
                  <ListItem
                    divider={!(expandedBadVoteIP === v.ip) && i < recentBadVoteUsers.length - 1}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="投票先の動画">
                          <IconButton
                            edge="end"
                            onClick={() =>
                              setExpandedBadVoteIP(expandedBadVoteIP === v.ip ? null : v.ip)
                            }
                          >
                            {expandedBadVoteIP === v.ip ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                        <BanButtons ip={v.ip} onBan={handleBan} />
                      </Stack>
                    }
                  >
                    <ListItemText
                      sx={{ pr: 17 }}
                      primary={
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <ThumbDownAltIcon color="warning" fontSize="small" />
                          <span>{v.ip}</span>
                        </Stack>
                      }
                      secondary={
                        `BAD投票: ${v.voteCount}件 / 最終投票: ${new Date(v.lastVoteAt).toLocaleString("ja-JP")}`
                      }
                    />
                  </ListItem>
                  <Collapse in={expandedBadVoteIP === v.ip} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ bgcolor: "action.hover" }}>
                      {v.votes.length === 0 && (
                        <ListItem>
                          <ListItemText secondary="投票先の動画情報は削除されています" />
                        </ListItem>
                      )}
                      {v.votes.map((vote, j) => (
                        <ListItem key={`${vote.requestId}-${vote.votedAt}`} divider={j < v.votes.length - 1}>
                          <ListItemAvatar>
                            <Avatar
                              variant="rounded"
                              src={vote.thumbnailUrl}
                              sx={{ width: 48, height: 36, mr: 1 }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={vote.title}
                            secondary={`BAD投票日時: ${new Date(vote.votedAt).toLocaleString("ja-JP")}`}
                            slotProps={{ primary: { noWrap: true } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                  {expandedBadVoteIP === v.ip && i < recentBadVoteUsers.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Box>
      )}

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
                        <BanButtons ip={u.ip} onBan={handleBan} />
                      </Stack>
                    }
                  >
                    <ListItemText
                      sx={{ pr: 17 }}
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

      {suspiciousFingerprints.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            プロクシっぽいユーザー ({suspiciousFingerprints.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            同じ端末の特徴を持ちながら、短時間に複数の異なるIPアドレスからアクセスしています。プロクシ/VPNでIPを切り替えながら多重にリクエストしている可能性があります。ネットワークの切り替え(Wi-Fi/モバイル回線など)で誤検知することもあるため、内容を確認した上で手動でBANしてください。
          </Typography>
          <Paper elevation={2}>
            <List disablePadding>
              {suspiciousFingerprints.map((f, i) => (
                <ListItem key={f.fingerprint} divider={i < suspiciousFingerprints.length - 1} sx={{ alignItems: "flex-start" }}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <VpnLockIcon color="warning" fontSize="small" />
                        <span>疑わしい端末 (IP {f.ips.length}件)</span>
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          最終検知: {new Date(f.lastSeen).toLocaleString("ja-JP")}
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                          {f.ips.map((ip) =>
                            bannedIPs.has(ip) ? (
                              <Chip key={ip} label={`${ip} (BAN中)`} color="error" size="small" />
                            ) : (
                              <Stack key={ip} direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
                                <Chip label={ip} size="small" variant="outlined" />
                                <BanButtons ip={ip} onBan={handleBan} size="small" />
                              </Stack>
                            ),
                          )}
                        </Stack>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {multiDeviceUsers.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            複数端末から投稿しているIP ({multiDeviceUsers.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            同じIPアドレスから、PCとスマホなど異なる種類の端末でのアクセスが検出されています。同じ家庭/オフィスのネットワークを複数人が共有しているだけの場合もあるため、内容を確認した上で手動でBANしてください。
          </Typography>
          <Paper elevation={2}>
            <List disablePadding>
              {multiDeviceUsers.map((d, i) => (
                <ListItem
                  key={d.ip}
                  divider={i < multiDeviceUsers.length - 1}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <BanButtons ip={d.ip} onBan={handleBan} />
                    </Stack>
                  }
                >
                  <ListItemText
                    sx={{ pr: 11 }}
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <DevicesIcon color="warning" fontSize="small" />
                        <span>{d.ip}</span>
                        <Stack direction="row" spacing={0.5}>
                          {d.classes.map((c) => (
                            <Chip
                              key={c}
                              label={DEVICE_CLASS_LABELS[c] ?? c}
                              size="small"
                              sx={{ height: 18, fontSize: "0.65rem" }}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    }
                    secondary={`最終検知: ${new Date(d.lastSeen).toLocaleString("ja-JP")}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {voteOnlyUsers.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            BADのみのユーザー ({voteOnlyUsers.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            過去1時間以内に、一度もリクエストをせず他の人のリクエストへのキャンセル投票(BAD投票)だけを行っているIPです。BANはこの一覧からは行われず、内容を確認した上で手動で行ってください。
          </Typography>
          <Paper elevation={2}>
            <List disablePadding>
              {voteOnlyUsers.map((v, i) => (
                <ListItem
                  key={v.ip}
                  divider={i < voteOnlyUsers.length - 1}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <BanButtons ip={v.ip} onBan={handleBan} />
                    </Stack>
                  }
                >
                  <ListItemText
                    sx={{ pr: 11 }}
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <ThumbDownAltIcon color="warning" fontSize="small" />
                        <span>{v.ip}</span>
                      </Stack>
                    }
                    secondary={
                      `BAD投票: ${v.voteCount}件 / 最終投票: ${new Date(v.lastVoteAt).toLocaleString("ja-JP")}`
                    }
                  />
                </ListItem>
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
                      <Stack direction="row" spacing={0.5}>
                        <BanButtons ip={ip} onBan={handleBan} />
                      </Stack>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={r.thumbnailUrl} sx={{ width: 48, height: 36, mr: 1 }} />
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ pr: 11 }}
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
