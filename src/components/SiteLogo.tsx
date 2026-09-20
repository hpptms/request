import Box from "@mui/material/Box";

// サイトのロゴ (public/logo.svg)。各ページのヘッダー左端で、以前の
// アイコンの代わりに使う。装飾なのでタイトル文字が読み上げられれば十分。
export function SiteLogo() {
  return (
    <Box
      component="img"
      src="/logo.svg"
      alt=""
      sx={{ height: { xs: 32, sm: 38 }, width: "auto", mr: 1.5, flexShrink: 0 }}
    />
  );
}
