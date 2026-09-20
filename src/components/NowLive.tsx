import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { api } from "../api";
import type { NowLiveItem } from "../types";

const REFRESH_MS = 60000;

const BRANDS: Record<NowLiveItem["key"], { bg: string; hover: string; fg: string }> = {
  youtube: { bg: "#FF0000", hover: "#CC0000", fg: "#FFFFFF" },
  niconico: { bg: "#EDEDED", hover: "#FFFFFF", fg: "#252525" },
  fc2: { bg: "#1E6FD9", hover: "#1859B0", fg: "#FFFFFF" },
};

// 配信中のプラットフォームへのリンク。管理画面で入力したURLの分だけ表示し、
// 1つも無ければ何も出さない。
export function NowLive() {
  const [items, setItems] = useState<NowLiveItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .getNowLive()
        .then(({ items }) => {
          if (!cancelled) setItems(items);
        })
        .catch(() => {
          // Purely a nicety — keep whatever was shown.
        });
    load();
    const interval = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "error.main",
              animation: "nowLivePulse 1.4s ease-in-out infinite",
              "@keyframes nowLivePulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.25 } },
            }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            NOW LIVE
          </Typography>
          <Typography variant="caption" color="text.secondary">
            配信中
          </Typography>
        </Stack>
        <Stack useFlexGap direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {items.map((it) => {
            const brand = BRANDS[it.key];
            return (
              <Button
                key={it.key}
                component="a"
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                startIcon={it.key === "youtube" ? <YouTubeIcon /> : <LiveTvIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: "none",
                  background: brand.bg,
                  color: brand.fg,
                  "&:hover": { background: brand.hover, boxShadow: "none" },
                }}
              >
                {it.label}
              </Button>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}
