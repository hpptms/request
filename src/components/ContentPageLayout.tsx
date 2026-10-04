import type { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import { Footer } from "./Footer";
import { SiteLogo } from "./SiteLogo";

// 文章主体のページ(使い方ガイド/よくある質問/利用規約)の共通枠。ヘッダー・
// 本文幅・フッターをAboutPage等と揃える。
export function ContentPageLayout({ title, lead, children }: { title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            {title}
          </Typography>
          <Button component={RouterLink} to="/" size="small" startIcon={<ArrowBackIcon />} sx={{ whiteSpace: "nowrap" }}>
            トップに戻る
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3.5}>
          {lead && (
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
              {lead}
            </Typography>
          )}
          {children}
        </Stack>
        <Footer />
      </Container>
    </Box>
  );
}

// 見出し(h2)+本文のひとまとまり。本文は段落ごとに配列で渡す。
export function ContentSection({ heading, paragraphs, children }: { heading: string; paragraphs?: string[]; children?: ReactNode }) {
  return (
    <Box component="section">
      <Typography variant="h6" component="h2" gutterBottom>
        {heading}
      </Typography>
      <Stack spacing={1.25}>
        {paragraphs?.map((p) => (
          <Typography key={p} variant="body1" sx={{ lineHeight: 1.9 }}>
            {p}
          </Typography>
        ))}
        {children}
      </Stack>
    </Box>
  );
}

export function ContentList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  return (
    <Stack component={ordered ? "ol" : "ul"} spacing={0.75} sx={{ m: 0, pl: 3 }}>
      {items.map((item) => (
        <Typography key={item} component="li" variant="body1" sx={{ lineHeight: 1.8 }}>
          {item}
        </Typography>
      ))}
    </Stack>
  );
}
