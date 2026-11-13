import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { api } from "../api";
import { ContentPageLayout, ContentList } from "../components/ContentPageLayout";
import { refreshAccount, setAccountMe, useAccount } from "../lib/account";
import { useSeo } from "../lib/useSeo";
import type { AccountMe, AccountUser } from "../types";

// Mirrors backend internal/account (MinUsernameLen etc.).
const MIN_USERNAME = 3;
const MAX_USERNAME = 20;
const MIN_PASSWORD = 8;

const PLAN_NAME = "サポーター プラン";
const PLAN_PRICE = "月額200円";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" });
}

// Sends the browser to a Stripe-hosted page (Checkout / Customer Portal).
async function goToStripe(open: () => Promise<{ url: string }>, setError: (e: string) => void, setBusy: (b: boolean) => void) {
  setBusy(true);
  try {
    const { url } = await open();
    window.location.assign(url);
  } catch (err) {
    setError(errorMessage(err, "ページを開けませんでした"));
    setBusy(false);
  }
}

function PlanComparison({ me }: { me: AccountMe }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          無料プラン
        </Typography>
        <ContentList
          items={[
            `リクエストは${me.freeRequestIntervalMinutes / 60}時間に1回まで`,
            `1時間あたり いいね${me.freeVoteLimits.like}票・bad${me.freeVoteLimits.bad}票まで`,
            "広告が表示されます",
          ]}
        />
      </Paper>
      <Paper variant="outlined" sx={{ p: 2, flex: 1, borderColor: "primary.main" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {PLAN_NAME}（{PLAN_PRICE}）
        </Typography>
        <ContentList
          items={[
            `キューに${me.supporterMaxPending}曲まで入れられます（待ち時間なし）`,
            `1時間あたり いいね${me.supporterVoteLimits.like}票・bad${me.supporterVoteLimits.bad}票まで`,
            "広告が表示されません",
          ]}
        />
      </Paper>
    </Stack>
  );
}

function CredentialsForm({ mode }: { mode: "login" | "register" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const register = mode === "register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (register && password !== confirm) {
      setError("確認用のパスワードが一致しません");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const me = register ? await api.accountRegister(username.trim(), password) : await api.accountLogin(username.trim(), password);
      setAccountMe(me);
    } catch (err) {
      setError(errorMessage(err, register ? "登録に失敗しました" : "ログインに失敗しました"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          label="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          fullWidth
          helperText={register ? `${MIN_USERNAME}〜${MAX_USERNAME}文字（文字・数字・「_」「-」「.」）。他の人には表示されません` : undefined}
          slotProps={{ htmlInput: { minLength: register ? MIN_USERNAME : undefined, maxLength: MAX_USERNAME } }}
        />
        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={register ? "new-password" : "current-password"}
          required
          fullWidth
          helperText={register ? `${MIN_PASSWORD}文字以上` : undefined}
          slotProps={{ htmlInput: { minLength: register ? MIN_PASSWORD : undefined } }}
        />
        {register && (
          <TextField
            label="パスワード（確認）"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            fullWidth
          />
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" disabled={submitting}>
          {register ? "登録してログイン" : "ログイン"}
        </Button>
        {register && (
          <Typography variant="body2" color="text.secondary">
            パスワードを忘れた場合は再設定できません。忘れないように保管してください。
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

function LoggedOut({ me }: { me: AccountMe }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  return (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
          <Tab value="login" label="ログイン" />
          <Tab value="register" label="新規登録" />
        </Tabs>
        <CredentialsForm key={tab} mode={tab} />
      </Paper>
      <Box>
        <Typography variant="h6" component="h2" gutterBottom>
          プランについて
        </Typography>
        <PlanComparison me={me} />
        {me.billingEnabled && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {PLAN_NAME}への加入にはアカウントの登録が必要です。
          </Typography>
        )}
      </Box>
    </>
  );
}

function subscriptionNote(user: AccountUser): string | null {
  const sub = user.subscription;
  if (!sub) return null;
  const date = formatDate(sub.periodEnd);
  if (user.plan === "supporter") {
    if (sub.cancelAtPeriodEnd) return date ? `解約済みです。${date}まで${PLAN_NAME}をご利用いただけます。` : "解約済みです。";
    return date ? `次回更新日: ${date}` : null;
  }
  if (sub.status === "past_due" || sub.status === "unpaid") {
    return "お支払いが確認できなかったため、特典を停止しています。「プランの管理」からお支払い方法をご確認ください。";
  }
  return null;
}

function LoggedIn({ me, user }: { me: AccountMe; user: AccountUser }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supporter = user.plan === "supporter";
  const note = subscriptionNote(user);

  const logout = async () => {
    setBusy(true);
    try {
      await api.accountLogout();
    } finally {
      await refreshAccount();
      setBusy(false);
    }
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
            <Typography variant="h6" component="h2" sx={{ wordBreak: "break-all" }}>
              {user.username}
            </Typography>
            <Chip
              size="small"
              color={supporter ? "primary" : "default"}
              icon={supporter ? <FavoriteIcon /> : undefined}
              label={supporter ? PLAN_NAME : "無料プラン"}
            />
          </Stack>
          <Typography variant="body1">
            {supporter
              ? `ご支援ありがとうございます。キューに${me.supporterMaxPending}曲まで入れられ、広告は表示されません。`
              : `リクエストは${me.freeRequestIntervalMinutes / 60}時間に1回、いいねは1時間${me.freeVoteLimits.like}票・badは${me.freeVoteLimits.bad}票までです。`}
          </Typography>
          {!supporter && me.freeRequestWaitSeconds > 0 && (
            <Typography variant="body2" color="text.secondary">
              次にリクエストできるまで: あと{Math.ceil(me.freeRequestWaitSeconds / 60)}分
            </Typography>
          )}
          {note && <Alert severity={supporter ? "info" : "warning"}>{note}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {!supporter && me.billingEnabled && (
              <Button
                variant="contained"
                startIcon={<FavoriteIcon />}
                disabled={busy}
                onClick={() => goToStripe(api.billingCheckout, setError, setBusy)}
              >
                {PLAN_NAME}に加入する（{PLAN_PRICE}）
              </Button>
            )}
            {user.hasBilling && me.billingEnabled && (
              <Button variant="outlined" startIcon={<SettingsIcon />} disabled={busy} onClick={() => goToStripe(api.billingPortal, setError, setBusy)}>
                プランの管理（お支払い方法の変更・解約）
              </Button>
            )}
            <Button variant="text" color="inherit" startIcon={<LogoutIcon />} disabled={busy} onClick={logout}>
              ログアウト
            </Button>
          </Stack>
          {!supporter && !me.billingEnabled && (
            <Typography variant="body2" color="text.secondary">
              {PLAN_NAME}は現在準備中です。
            </Typography>
          )}
        </Stack>
      </Paper>
      {!supporter && (
        <Box>
          <Typography variant="h6" component="h2" gutterBottom>
            プランについて
          </Typography>
          <PlanComparison me={me} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            お支払いはStripeの決済ページで行います（クレジットカード情報は当サイトには保存されません）。毎月自動更新され、いつでも解約できます。
          </Typography>
        </Box>
      )}
    </>
  );
}

// Back from Stripe Checkout: confirm the new plan straight away (the
// webhook may not have arrived yet), retrying briefly while it's still
// being processed.
function useCheckoutReturn() {
  const [params, setParams] = useSearchParams();
  const checkout = params.get("checkout");
  const [message, setMessage] = useState<{ severity: "success" | "info" | "warning"; text: string } | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!checkout || handled.current) return;
    handled.current = true;
    setParams({}, { replace: true });
    if (checkout === "cancel") {
      setMessage({ severity: "info", text: "お手続きはキャンセルされました。" });
      return;
    }
    if (checkout !== "success") return;
    setMessage({ severity: "info", text: "お支払いを確認しています…" });
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 5 && !cancelled; i++) {
        try {
          const me = await api.billingSync();
          setAccountMe(me);
          if (me.user?.plan === "supporter") {
            setMessage({ severity: "success", text: `${PLAN_NAME}へのご加入ありがとうございます！` });
            return;
          }
        } catch {
          // retry below
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) {
        setMessage({ severity: "warning", text: "お支払いの反映に時間がかかっています。しばらくしてからこのページを再読み込みしてください。" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkout, setParams]);

  return message;
}

// /account: register, log in/out, and manage the サポーター プラン.
function AccountPage() {
  const account = useAccount();
  const checkoutMessage = useCheckoutReturn();

  useSeo("アカウント | 動画リクエストキュー", "動画リクエストキューのアカウント・サポーター プランの管理ページです。", "/account", { noindex: true });

  let body;
  if (account.status === "loading") {
    body = (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  } else if (account.status === "disabled") {
    body = <Typography variant="body1">アカウント機能は現在準備中です。</Typography>;
  } else if (account.me.user) {
    body = <LoggedIn me={account.me} user={account.me.user} />;
  } else {
    body = <LoggedOut me={account.me} />;
  }

  return (
    <ContentPageLayout title="アカウント">
      {checkoutMessage && <Alert severity={checkoutMessage.severity}>{checkoutMessage.text}</Alert>}
      {body}
    </ContentPageLayout>
  );
}

export default AccountPage;
