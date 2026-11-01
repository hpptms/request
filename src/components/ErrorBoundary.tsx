import { Component, type ErrorInfo, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

// 描画中の例外（ブラウザ翻訳による DOM 書き換えなど）でアプリ全体が
// 白画面のまま止まらないよう、再読み込みを促す画面に切り替える。
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, p: 3, textAlign: "center" }}>
        <Typography variant="h6">表示中にエラーが発生しました</Typography>
        <Typography variant="body2" color="text.secondary">
          ページを再読み込みしてください。ブラウザの翻訳機能を使っている場合は、翻訳をオフにすると改善することがあります。
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </Box>
    );
  }
}
