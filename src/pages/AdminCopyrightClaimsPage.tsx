import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { api } from "../api";
import { visibleInterval } from "../lib/visibleInterval";
import type { CopyrightClaim, CopyrightClaimStatus } from "../types";

const STATUS_LABELS: Record<CopyrightClaimStatus, string> = {
  new: "未対応",
  in_progress: "対応中",
  done: "対応済み",
  rejected: "対応しない",
};

const STATUS_COLORS: Record<CopyrightClaimStatus, "error" | "warning" | "success" | "default"> = {
  new: "error",
  in_progress: "warning",
  done: "success",
  rejected: "default",
};

type Draft = { status: CopyrightClaimStatus; adminNote: string };

// 著作権画面 (/admin/copyright): /copyright-request から届いた著作権者・代理人
// からの停止依頼を一覧し、対応状況と対応メモを記録する
// (backend/internal/copyrightclaim)。依頼者への返信はサイト上ではなく、
// 依頼に書かれたメールアドレス等へ直接行う。
function AdminCopyrightClaimsPage() {
  const [claims, setClaims] = useState<CopyrightClaim[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { claims } = await api.adminListCopyrightClaims();
      setClaims(claims);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    refresh();
    return visibleInterval(refresh, 30000);
  }, [refresh]);

  const draftOf = (c: CopyrightClaim): Draft => drafts[c.id] ?? { status: c.status, adminNote: c.adminNote };
  const setDraft = (c: CopyrightClaim, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [c.id]: { ...draftOf(c), ...patch } }));

  const handleSave = async (c: CopyrightClaim) => {
    const d = draftOf(c);
    try {
      await api.adminUpdateCopyrightClaim(c.id, d.status, d.adminNote);
      setDrafts((all) => {
        const next = { ...all };
        delete next[c.id];
        return next;
      });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const handleDelete = async (c: CopyrightClaim) => {
    if (!window.confirm(`お問い合わせ #${c.id} を削除しますか?(元に戻せません)`)) return;
    try {
      await api.adminDeleteCopyrightClaim(c.id);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <Typography variant="body2" color="text.secondary">
        著作権に関するお問い合わせフォームから届いた依頼です。依頼者への連絡は、記載されたメールアドレス等へ直接行ってください。対応の記録として、期間による自動削除はしていません。
      </Typography>

      {claims.length === 0 ? (
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
          <Typography color="text.secondary">お問い合わせはありません</Typography>
        </Paper>
      ) : (
        claims.map((c) => {
          const d = draftOf(c);
          const dirty = d.status !== c.status || d.adminNote !== c.adminNote;
          return (
            <Paper key={c.id} elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  #{c.id} ・ {new Date(c.createdAt).toLocaleString("ja-JP")}
                </Typography>
                <Chip size="small" color={STATUS_COLORS[c.status]} label={STATUS_LABELS[c.status]} />
                <Tooltip title="このお問い合わせを削除">
                  <IconButton size="small" onClick={() => handleDelete(c)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack spacing={1.25} sx={{ mb: 2 }}>
                <Field label="対象動画">
                  {c.videoUrls.map((u) => (
                    <Link key={u} href={u} target="_blank" rel="noopener noreferrer" sx={{ display: "block", wordBreak: "break-all" }}>
                      {u}
                    </Link>
                  ))}
                </Field>
                <Field label="依頼者">
                  {c.claimant === "owner" ? "権利者ご本人" : "代理人"} ・ {c.name}
                  {c.organization && `(${c.organization})`}
                </Field>
                {c.claimant === "agent" && <Field label="権利者">{c.rightsHolder}</Field>}
                <Field label="権利者であることが分かる情報">{c.basis}</Field>
                {c.proofUrl && (
                  <Field label="確認用URL">
                    <Link href={c.proofUrl} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: "break-all" }}>
                      {c.proofUrl}
                    </Link>
                  </Field>
                )}
                <Field label="連絡先">
                  <Link href={`mailto:${c.email}`}>{c.email}</Link>
                  {c.phone && ` ・ ${c.phone}`}
                </Field>
                <Field label="停止を希望する範囲">
                  {[c.stopSite && "当サイトでの再生", c.stopStream && "運営者が行う配信での使用"].filter(Boolean).join("・")}
                </Field>
                {c.details && <Field label="その他・詳細">{c.details}</Field>}
                <Field label="送信元IP">
                  <Box component="span" sx={{ fontFamily: "monospace" }}>
                    {c.ip}
                  </Box>
                </Field>
              </Stack>

              <Stack spacing={1.5}>
                <TextField
                  select
                  label="対応状況"
                  size="small"
                  value={d.status}
                  onChange={(e) => setDraft(c, { status: e.target.value as CopyrightClaimStatus })}
                  sx={{ maxWidth: 200 }}
                >
                  {(Object.keys(STATUS_LABELS) as CopyrightClaimStatus[]).map((s) => (
                    <MenuItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="対応メモ(管理者のみ)"
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={8}
                  value={d.adminNote}
                  onChange={(e) => setDraft(c, { adminNote: e.target.value })}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={!dirty}
                  onClick={() => handleSave(c)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  保存
                </Button>
              </Stack>
            </Paper>
          );
        })
      )}
    </Stack>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography component="div" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Box>
  );
}

export default AdminCopyrightClaimsPage;
