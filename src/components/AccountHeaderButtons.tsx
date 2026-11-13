import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAccount } from "../lib/account";

// ヘッダー右側の「ログイン」「新規登録」(ログイン中はユーザー名)。会員機能が
// ON(lib/account.ts の status "ready")のときだけ出す。スマホ幅ではアイコン
// のみ(ログイン・新規登録は1つにまとめる)にして、タイトルや他のボタンを
// 押し出さないようにする。/account 自身では出さない。compact は、ヘッダーに
// 他のボタンが多いページ(トップ)がタブレット幅でもアイコン表示にするため。
export function AccountHeaderButtons({ compact = false }: { compact?: boolean }) {
  const account = useAccount();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery(useTheme().breakpoints.down("sm")) || compact;
  if (account.status !== "ready" || pathname === "/account") return null;
  const user = account.me.user;
  const sx = { whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 1.5 } as const;

  if (user) {
    const supporter = user.plan === "supporter";
    const icon = supporter ? <FavoriteIcon fontSize="small" /> : <AccountCircleIcon fontSize="small" />;
    return (
      <Button
        component={RouterLink}
        to="/account"
        size="small"
        aria-label={`アカウント（${user.username}）`}
        startIcon={isMobile ? undefined : icon}
        sx={{ ...sx, maxWidth: { sm: 160 } }}
      >
        {isMobile ? (
          icon
        ) : (
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</span>
        )}
      </Button>
    );
  }

  // Phones: the board header already holds six icon buttons, so login and
  // register share one icon (the account page has a tab for each).
  if (isMobile) {
    return (
      <Button component={RouterLink} to="/account?tab=login" size="small" aria-label="ログイン・新規登録" sx={sx}>
        <LoginIcon fontSize="small" />
      </Button>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: "center" }}>
      <Button
        component={RouterLink}
        to="/account?tab=login"
        size="small"
        startIcon={<LoginIcon />}
        sx={sx}
      >
        ログイン
      </Button>
      <Button
        component={RouterLink}
        to="/account?tab=register"
        size="small"
        variant="outlined"
        startIcon={<PersonAddIcon />}
        sx={sx}
      >
        新規登録
      </Button>
    </Stack>
  );
}
