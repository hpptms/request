import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import { visibleInterval } from "../lib/visibleInterval";
import { Fc2Mark, NiconicoMark } from "./BrandIcons";
import { PlayCta } from "./PlayCta";
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
// 同じ列の最後にサイト内の再生画面(/play)への「みんなで同時視聴する」も
// 並べる。配信が1つも無いときは、その誘導ボタンだけを単独で出す。
export function NowLive({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [items, setItems] = useState<NowLiveItem[]>([]);
  const [loaded, setLoaded] = useState(false);

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
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    load();
    const stop = visibleInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  useEffect(() => {
    if (loaded) onLoaded?.();
  }, [loaded, onLoaded]);

  if (items.length === 0) return loaded ? <PlayCta /> : null;

  // All tiles (live platforms + 同時視聴) stay on one row: tighter padding/
  // font/icon than a normal large button, shrinking further on phones, and
  // allowed to shrink rather than wrap if the row is still too tight.
  const tileSx = {
    flex: "0 1 auto",
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textTransform: "none",
    fontWeight: 800,
    fontSize: { xs: "0.75rem", sm: "0.95rem" },
    minHeight: { xs: 42, sm: 46 },
    px: { xs: 0.75, sm: 1.75 },
    borderRadius: 2,
    boxShadow: "none",
    "& .MuiButton-startIcon": { ml: 0, mr: { xs: 0.4, sm: 0.75 } },
    "&:hover": { boxShadow: "none" },
  } as const;
  const iconSx = { fontSize: { xs: 18, sm: 24 } } as const;

  return (
    <Paper variant="outlined" sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
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
        <Stack useFlexGap direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ flexWrap: "nowrap" }}>
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
                startIcon={<brand.Icon sx={iconSx} />}
                sx={{
                  ...tileSx,
                  background: brand.bg,
                  color: brand.fg,
                  "&:hover": { background: brand.hover, boxShadow: "none" },
                }}
              >
                {it.label}
              </Button>
            );
          })}
          <Button
            component={RouterLink}
            to="/play"
            variant="contained"
            startIcon={<PlayCircleIcon sx={iconSx} />}
            sx={tileSx}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              みんなで
            </Box>
            同時視聴する
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
