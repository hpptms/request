import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Props {
  title: string;
  children: ReactNode;
  // "card" is the raised card (h6 title); "outlined" the plain bordered
  // notice box (subtitle title).
  variant?: "card" | "outlined";
  defaultOpen?: boolean;
}

// 畳める枠。ネイティブの <details>/<summary> なので、開閉の状態がブラウザと
// スクリーンリーダーにそのまま伝わり、畳んでいる間も本文はDOMに残る
// (検索エンジンにも読まれる)。
export function Collapsible({ title, children, variant = "card", defaultOpen = false }: Props) {
  const card = variant === "card";
  return (
    <Paper
      component="details"
      open={defaultOpen || undefined}
      {...(card ? { elevation: 2 } : { variant: "outlined" as const })}
      sx={{ "&[open] > summary .collapsible-chevron": { transform: "rotate(180deg)" } }}
    >
      <Box
        component="summary"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          cursor: "pointer",
          listStyle: "none",
          "&::-webkit-details-marker": { display: "none" },
          px: card ? { xs: 2, sm: 3 } : 2,
          py: card ? 1.5 : 1.25,
          borderRadius: 1,
          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
        }}
      >
        <Typography variant={card ? "h6" : "subtitle2"} component="span">
          {title}
        </Typography>
        <ExpandMoreIcon className="collapsible-chevron" sx={{ transition: "transform 0.2s" }} />
      </Box>
      <Box sx={{ px: card ? { xs: 2, sm: 3 } : 2, pb: card ? { xs: 2, sm: 3 } : 1.5 }}>{children}</Box>
    </Paper>
  );
}
