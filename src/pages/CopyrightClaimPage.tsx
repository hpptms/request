import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Link from "@mui/material/Link";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import { ContentPageLayout, ContentSection } from "../components/ContentPageLayout";
import { usePageSeo } from "../lib/useSeo";
import type { CopyrightClaimSubmission } from "../types";

// backend/internal/copyrightclaim の上限と揃える。
const MAX_VIDEO_URLS = 20;

const EMPTY_FORM: Omit<CopyrightClaimSubmission, "videoUrls"> & { videoUrls: string } = {
  videoUrls: "",
  claimant: "owner",
  name: "",
  organization: "",
  rightsHolder: "",
  basis: "",
  proofUrl: "",
  email: "",
  phone: "",
  stopSite: true,
  stopStream: true,
  details: "",
  agreed: false,
};

// 著作権に関するお問い合わせ (/copyright-request)。著作権者・代理人が対象動画・
// 権利の根拠・連絡先を送り、管理画面の「著作権」タブで対応する
// (backend/internal/copyrightclaim)。
function CopyrightClaimPage() {
  usePageSeo("/copyright-request");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const videoUrls = form.videoUrls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
  const canSubmit =
    videoUrls.length > 0 &&
    videoUrls.length <= MAX_VIDEO_URLS &&
    form.name.trim() !== "" &&
    (form.claimant === "owner" || form.rightsHolder.trim() !== "") &&
    form.basis.trim() !== "" &&
    form.email.trim() !== "" &&
    (form.stopSite || form.stopStream) &&
    form.agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await api.submitCopyrightClaim({ ...form, videoUrls });
      setSubmitted(true);
      setForm(EMPTY_FORM);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentPageLayout
      title="著作権に関するお問い合わせ"
      lead={
        <>
          ご自身が権利を持つ動画について、当サイトでの再生や運営者が行う配信での使用の停止をご希望の場合は、以下のフォームからご連絡ください。内容を確認のうえ、速やかに対応いたします。取り扱いについては
          <Link component={RouterLink} to="/copyright">
            著作権ガイドライン
          </Link>
          をご覧ください。
        </>
      }
    >
      {submitted && (
        <Alert severity="success" onClose={() => setSubmitted(false)}>
          お問い合わせを受け付けました。内容を確認のうえ、ご入力いただいた連絡先へご連絡いたします。
        </Alert>
      )}

      <Stack component="form" spacing={3.5} onSubmit={handleSubmit} noValidate>
        <ContentSection heading="1. 対象となる動画">
          <TextField
            label="動画のURL"
            required
            multiline
            minRows={3}
            fullWidth
            value={form.videoUrls}
            onChange={(e) => set("videoUrls", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            error={videoUrls.length > MAX_VIDEO_URLS}
            helperText={`1行に1件ずつ、${MAX_VIDEO_URLS}件まで入力できます(${videoUrls.length}件)`}
          />
        </ContentSection>

        <ContentSection heading="2. 権利者の情報">
          <FormControl required>
            <FormLabel>お問い合わせされる方</FormLabel>
            <RadioGroup
              row
              value={form.claimant}
              onChange={(e) => set("claimant", e.target.value as CopyrightClaimSubmission["claimant"])}
            >
              <FormControlLabel value="owner" control={<Radio />} label="権利者ご本人" />
              <FormControlLabel value="agent" control={<Radio />} label="権利者の代理人" />
            </RadioGroup>
          </FormControl>
          <TextField
            label="お名前(または名称)"
            required
            fullWidth
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField
            label="会社・団体名"
            fullWidth
            value={form.organization}
            onChange={(e) => set("organization", e.target.value)}
            helperText="法人・団体としてご連絡の場合"
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          {form.claimant === "agent" && (
            <TextField
              label="権利者の名称"
              required
              fullWidth
              value={form.rightsHolder}
              onChange={(e) => set("rightsHolder", e.target.value)}
              helperText="代理されている権利者(個人・法人)のお名前"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
          )}
          <TextField
            label="権利者であることが分かる情報"
            required
            multiline
            minRows={3}
            fullWidth
            value={form.basis}
            onChange={(e) => set("basis", e.target.value)}
            helperText="例: 動画の投稿者本人である、楽曲・映像の著作権を保有している、権利者から委任を受けている など"
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
          <TextField
            label="確認用のURL"
            fullWidth
            value={form.proofUrl}
            onChange={(e) => set("proofUrl", e.target.value)}
            placeholder="https://"
            helperText="公式サイト・チャンネル・SNSアカウントなど、上記を確認できるページがあればご記入ください"
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </ContentSection>

        <ContentSection heading="3. ご連絡先">
          <TextField
            label="メールアドレス"
            type="email"
            required
            fullWidth
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 254 } }}
          />
          <TextField
            label="電話番号"
            type="tel"
            fullWidth
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 30 } }}
          />
        </ContentSection>

        <ContentSection heading="4. ご依頼の内容">
          <FormControl required error={!form.stopSite && !form.stopStream}>
            <FormLabel>停止を希望する範囲</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={form.stopSite} onChange={(e) => set("stopSite", e.target.checked)} />}
                label="当サイトでの再生"
              />
              <FormControlLabel
                control={<Checkbox checked={form.stopStream} onChange={(e) => set("stopStream", e.target.checked)} />}
                label="運営者が行う配信での使用"
              />
            </FormGroup>
            {!form.stopSite && !form.stopStream && <FormHelperText>どちらか1つ以上を選択してください</FormHelperText>}
          </FormControl>
          <TextField
            label="その他・詳細"
            multiline
            minRows={3}
            fullWidth
            value={form.details}
            onChange={(e) => set("details", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
        </ContentSection>

        <Stack spacing={1.5}>
          <FormControlLabel
            control={<Checkbox checked={form.agreed} onChange={(e) => set("agreed", e.target.checked)} />}
            label="記載した内容は真実であり、私は対象動画の権利者本人、または権利者から正当に委任を受けた代理人であることに相違ありません。"
          />
          <Typography variant="body2" color="text.secondary">
            ご入力いただいた情報は、本件の確認・対応およびご連絡のためにのみ利用します。詳しくは
            <Link component={RouterLink} to="/privacy">
              プライバシーポリシー
            </Link>
            をご覧ください。
          </Typography>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            disabled={!canSubmit || submitting}
            sx={{ alignSelf: "flex-start" }}
          >
            送信する
          </Button>
        </Stack>
      </Stack>
    </ContentPageLayout>
  );
}

export default CopyrightClaimPage;
