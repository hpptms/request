import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import { useAccount } from "../lib/account";

// /notice: a banned visitor (App redirects them here) is told that the
// サポーター プラン isn't subject to bans — the backend treats a subscribed
// member as a supporter even if their IP is banned (api.Server.banExempt).
// Only while memberships are on, and only to someone actually banned.
export function BannedSupporterNote() {
  const account = useAccount();
  const [banned, setBanned] = useState(false);
  useEffect(() => {
    let cancelled = false;
    api
      .getBanStatus()
      .then(({ banned }) => !cancelled && setBanned(banned))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  if (!banned || account.status !== "ready" || !account.me.billingEnabled || account.me.user?.plan === "supporter") return null;
  return (
    <Alert
      severity="info"
      action={
        <Button color="inherit" size="small" component={RouterLink} to={account.me.user ? "/account" : "/account?tab=register"}>
          詳しく
        </Button>
      }
    >
      現在この端末からのリクエストは制限されています。サポーター プラン（月額200円）に加入すると、サポーターとして引き続きご利用いただけます。
    </Alert>
  );
}
