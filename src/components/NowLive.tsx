import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { api } from "../api";
import { Fc2Mark, NiconicoMark } from "./BrandIcons";
import type { NowLiveItem } from "../types";

const REFRESH_MS = 60000;

// Each platform's tile: its brand colours as the background and its mark as
// the icon, so a viewer can tell them apart before reading the label.
const BRANDS: Record<NowLiveItem["key"], { bg: string; hover: string; fg: string; Icon: ComponentType<SvgIconProps> }> = {
  youtube: {
    bg: "linear-gradient(135deg, #FF0000, #C4000B)",
    hover: "linear-gradient(135deg, #E00000, #A60009)",
    fg: "#FFFFFF",
    Icon: YouTubeIcon,
  },
  niconico: {
    bg: "linear-gradient(135deg, #3A3A3A, #1B1B1B)",
    hover: "linear-gradient(135deg, #4A4A4A, #262626)",
    fg: "#FFFFFF",
    Icon: NiconicoMark,
  },
  fc2: {
    bg: "linear-gradient(135deg, #2F7BEA, #1745A8)",
    hover: "linear-gradient(135deg, #276CD1, #123A90)",
    fg: "#FFFFFF",
    Icon: Fc2Mark,
  },
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
                startIcon={<brand.Icon sx={{ fontSize: 28 }} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "1rem",
                  minHeight: 48,
                  px: 2.5,
                  borderRadius: 2,
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
