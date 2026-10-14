import { useState } from "react";
import type { ComponentType } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import type { CollapseProps } from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import SendIcon from "@mui/icons-material/Send";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { TransitionGroup } from "react-transition-group";
import { api } from "../api";
import type { VisibleChat } from "../lib/usePlayChat";
import { Fc2Mark, NiconicoMark } from "./BrandIcons";

// Lines relayed from a live stream's chat get that platform's mark and
// colour. ニコニコ's are deliberately the loudest — bigger, with a bright
// frame — to draw comments onto the platform that has the fewest.
const SOURCE_STYLES: Record<
  Exclude<VisibleChat["source"], "site">,
  { Icon: ComponentType<SvgIconProps>; iconBg: string; border: string; fontSize: string }
> = {
  youtube: { Icon: YouTubeIcon, iconBg: "#FF0000", border: "rgba(255, 0, 0, 0.8)", fontSize: "0.95rem" },
  fc2: { Icon: Fc2Mark, iconBg: "#2F7BEA", border: "rgba(47, 123, 234, 0.8)", fontSize: "0.95rem" },
  niconico: { Icon: NiconicoMark, iconBg: "#252525", border: "#FFD600", fontSize: "1.1rem" },
};

// Chat lines laid over the bottom-left of the /play video area — the /play
// form's and the live streams' comments together. Ignores pointer events so
// it never blocks the like/bad buttons underneath.
export function PlayChatOverlay({ lines }: { lines: VisibleChat[] }) {
  if (lines.length === 0) return null;
  return (
    <Stack
      spacing={0.5}
      sx={{
        position: "absolute",
        left: { xs: 8, sm: 16 },
        // Above the bottom-center title card, which would otherwise sit on top of it.
        bottom: { xs: 72, sm: 96 },
        maxWidth: { xs: "calc(100% - 16px)", md: "55%" },
        zIndex: 5,
        pointerEvents: "none",
        alignItems: "flex-start",
      }}
    >
      {lines.map((l) => {
        const style = l.source === "site" ? undefined : SOURCE_STYLES[l.source];
        return (
          <Stack
            key={l.id}
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              px: 1.25,
              py: 0.5,
              borderRadius: 1,
              bgcolor: "rgba(0, 0, 0, 0.7)",
              color: "#fff",
              fontSize: style?.fontSize ?? "0.95rem",
              fontWeight: l.source === "niconico" ? 700 : undefined,
              border: style ? `2px solid ${style.border}` : undefined,
              wordBreak: "break-word",
            }}
          >
            {style && (
              <Box
                sx={{
                  display: "flex",
                  flexShrink: 0,
                  p: 0.25,
                  borderRadius: 0.75,
                  bgcolor: style.iconBg,
                }}
              >
                <style.Icon sx={{ fontSize: "1.1em", color: "#fff" }} />
              </Box>
            )}
            <span>{l.text}</span>
          </Stack>
        );
      })}
    </Stack>
  );
}

// The /viewer (stream output) screen's comment column: bottom-left, each
// line on a translucent background tinted by where it came from. Lines are
// oldest-first in a bottom-anchored column, so a new comment appears at the
// bottom and pushes the ones still showing upward.
//
// Motion only on the way in and out — a line is perfectly still while it's
// up, so it never gets in the way of reading. In: the row opens (smoothly
// pushing the others up), the card slides in from the left with a slight
// overshoot, its platform-coloured edge bar draws in and one light glint
// sweeps across. Out: the card slides back left and fades, then its row
// closes.
const VIEWER_BACKGROUNDS: Record<VisibleChat["source"], string> = {
  site: "rgba(0, 0, 0, 0.55)",
  youtube: "rgba(150, 0, 0, 0.55)",
  fc2: "rgba(20, 70, 170, 0.55)",
  niconico: "rgba(60, 60, 60, 0.6)",
};

const VIEWER_ACCENTS: Record<VisibleChat["source"], string> = {
  site: "rgba(255, 255, 255, 0.85)",
  youtube: "#FF3B3B",
  fc2: "#4C8DFF",
  niconico: "#FFD600",
};

const ROW_OPEN_MS = 300;
const CARD_EXIT_MS = 350;
const ROW_CLOSE_MS = 250;

export function ViewerCommentOverlay({ lines }: { lines: VisibleChat[] }) {
  // Always mounted (even when empty) so the last line can animate out.
  return (
    <Box
      sx={{
        position: "absolute",
        left: { xs: 8, sm: 16, md: 24 },
        // Above the bottom-center title card, like the /play overlay.
        bottom: { xs: 72, sm: 96, md: 120 },
        maxWidth: { xs: "calc(100% - 16px)", md: "55%" },
        zIndex: 5,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <TransitionGroup component={null}>
        {lines.map((l) => (
          <ViewerCommentRow key={l.id} line={l} />
        ))}
      </TransitionGroup>
    </Box>
  );
}

// TransitionGroup clones this with in/onExited etc., handed on to Collapse.
function ViewerCommentRow({ line, in: inProp, ...transition }: { line: VisibleChat } & Partial<CollapseProps>) {
  const leaving = inProp === false;
  const style = line.source === "site" ? undefined : SOURCE_STYLES[line.source];
  const accent = VIEWER_ACCENTS[line.source] ?? VIEWER_ACCENTS.site;
  return (
    <Collapse
      {...transition}
      in={inProp}
      timeout={{ enter: ROW_OPEN_MS, exit: CARD_EXIT_MS + ROW_CLOSE_MS }}
      // On the way out, hold the row open until the card has slid away.
      style={{ transitionDelay: leaving ? `${CARD_EXIT_MS}ms` : "0ms", transitionDuration: leaving ? `${ROW_CLOSE_MS}ms` : undefined }}
    >
      <Box sx={{ pt: 1.5 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            position: "relative",
            overflow: "hidden",
            alignItems: "center",
            pl: 3.5,
            pr: 2.5,
            py: 1,
            borderRadius: 2,
            bgcolor: VIEWER_BACKGROUNDS[line.source] ?? VIEWER_BACKGROUNDS.site,
            color: "#fff",
            fontSize: { xs: "1.9rem", md: "2.3rem" },
            fontWeight: line.source === "niconico" ? 700 : undefined,
            border: line.source === "niconico" ? "4px solid rgba(255, 214, 0, 0.85)" : undefined,
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.6)",
            wordBreak: "break-word",
            animation: leaving
              ? `viewerCommentOut ${CARD_EXIT_MS}ms ease-in forwards`
              : "viewerCommentIn 650ms cubic-bezier(0.2, 0.9, 0.3, 1.15) both",
            // Edge bar in the platform's colour, drawn top to bottom on entry.
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 8,
              bgcolor: accent,
              transformOrigin: "top",
              animation: "viewerCommentBar 400ms ease-out 100ms both",
            },
            // A single glint across the card, then gone.
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "40%",
              background: "linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.35), transparent)",
              transform: "translateX(-120%)",
              animation: "viewerCommentGlint 800ms ease-in-out 250ms both",
            },
            "@keyframes viewerCommentIn": {
              "0%": { opacity: 0, transform: "translateX(-60px) skewX(-8deg)", filter: "blur(4px)" },
              "60%": { opacity: 1, transform: "translateX(8px) skewX(0deg)", filter: "blur(0)" },
              "100%": { opacity: 1, transform: "none", filter: "none" },
            },
            "@keyframes viewerCommentOut": {
              from: { opacity: 1, transform: "none", filter: "none" },
              to: { opacity: 0, transform: "translateX(-50px)", filter: "blur(3px)" },
            },
            "@keyframes viewerCommentBar": {
              from: { transform: "scaleY(0)" },
              to: { transform: "scaleY(1)" },
            },
            "@keyframes viewerCommentGlint": {
              "0%": { transform: "translateX(-120%)", opacity: 1 },
              "99%": { transform: "translateX(320%)", opacity: 1 },
              "100%": { transform: "translateX(320%)", opacity: 0 },
            },
          }}
        >
          {style && <style.Icon sx={{ fontSize: "1.2em", color: "#fff", flexShrink: 0, position: "relative" }} />}
          <span style={{ position: "relative" }}>{line.text}</span>
        </Stack>
      </Box>
    </Collapse>
  );
}

// One-row message box: メッセージ + 送信.
export function PlayChatForm({ onSent }: { onSent: () => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.sendChat(body);
      setText("");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack direction="row" spacing={1}>
        <TextField
          label="メッセージ"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          size="small"
          error={error !== null}
          helperText={error ?? undefined}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<SendIcon />}
          disabled={sending || !text.trim()}
          sx={{
            whiteSpace: "nowrap",
            flexShrink: 0,
            alignSelf: "flex-start",
            minHeight: 40,
            px: { xs: 1.5, sm: 2 },
            "& .MuiButton-startIcon": { display: { xs: "none", sm: "inherit" } },
          }}
        >
          送信
        </Button>
      </Stack>
    </Box>
  );
}
