import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Link as RouterLink } from "react-router-dom";

// 集計・ヒートマップ画面のヘッダー右側の「再生」「トップに戻る」。スマホ幅
// (sm未満)ではアイコンのみにして、タイトルが「アクテ…」のように潰れるのを防ぐ。
export function PublicNavButtons() {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const sx = { whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 2 } as const;
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
      <Button
        component={RouterLink}
        to="/play"
        size="small"
        aria-label={isMobile ? "再生" : undefined}
        startIcon={isMobile ? undefined : <PlayCircleIcon />}
        sx={sx}
      >
        {isMobile ? <PlayCircleIcon fontSize="small" /> : "再生"}
      </Button>
      <Button
        component={RouterLink}
        to="/"
        size="small"
        aria-label={isMobile ? "トップに戻る" : undefined}
        startIcon={isMobile ? undefined : <ArrowBackIcon />}
        sx={sx}
      >
        {isMobile ? <ArrowBackIcon fontSize="small" /> : "トップに戻る"}
      </Button>
    </Stack>
  );
}
