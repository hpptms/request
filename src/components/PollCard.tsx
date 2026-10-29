import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import type { Poll } from "../types";

// One アンケート: the question, then each option as a tappable row with its
// vote share bar behind it. Tapping saves right away — a single-choice
// poll switches to the tapped option (tapping your own again withdraws),
// a multiple-choice one toggles it. onAnswer is left out where the poll is
// only shown (the admin panel), and closed polls only show their results.
// collapsible starts with just the question showing, opened by clicking it
// (the board, where the options would take up too much room).
export function PollCard({
  poll,
  onAnswer,
  header,
  collapsible = false,
}: {
  poll: Poll;
  onAnswer?: (choices: number[]) => Promise<void>;
  header?: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canAnswer = onAnswer !== undefined && !poll.closed;
  const total = poll.votes.reduce((sum, v) => sum + v, 0);

  const toggle = async (i: number) => {
    if (!onAnswer) return;
    const mine = poll.myChoices.includes(i);
    const next = poll.multiple ? (mine ? poll.myChoices.filter((c) => c !== i) : [...poll.myChoices, i]) : mine ? [] : [i];
    setSending(true);
    setError(null);
    try {
      await onAnswer(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "回答に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const [CheckedIcon, UncheckedIcon] = poll.multiple
    ? [CheckBoxIcon, CheckBoxOutlineBlankIcon]
    : [RadioButtonCheckedIcon, RadioButtonUncheckedIcon];

  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
      {header}
      <Stack
        direction="row"
        spacing={1}
        {...(collapsible && {
          component: ButtonBase,
          onClick: () => setOpen((v) => !v),
          "aria-expanded": open,
        })}
        sx={{
          alignItems: "center",
          width: "100%",
          textAlign: "left",
          borderRadius: 1,
          mb: open ? 1 : 0,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            flexGrow: 1,
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          {poll.question}
        </Typography>
        {poll.closed && <Chip label="締切" size="small" sx={{ flexShrink: 0 }} />}
        {collapsible && !open && poll.myChoices.length > 0 && <Chip label="回答済み" color="primary" size="small" sx={{ flexShrink: 0 }} />}
        {collapsible && (
          <ExpandMoreIcon
            sx={{
              flexShrink: 0,
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : undefined,
            }}
          />
        )}
      </Stack>
      {collapsible && !open && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          {poll.voters}人が回答 ・ タップして
          {canAnswer ? "回答する" : "結果を見る"}
        </Typography>
      )}
      <Collapse in={open}>
        <Stack spacing={0.75}>
          {poll.options.map((option, i) => {
            const mine = poll.myChoices.includes(i);
            const votes = poll.votes[i] ?? 0;
            const share = total > 0 ? votes / total : 0;
            const row = (
              <Box
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  width: "100%",
                  border: 1,
                  borderColor: mine ? "primary.main" : "divider",
                  borderRadius: 1,
                  px: 1.25,
                  py: 0.75,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: `${share * 100}%`,
                    bgcolor: mine ? "primary.main" : "action.selected",
                    opacity: mine ? 0.15 : 1,
                    transition: "width 0.3s",
                  }}
                />
                <Stack direction="row" spacing={1} sx={{ position: "relative", alignItems: "center" }}>
                  {canAnswer &&
                    (mine ? <CheckedIcon fontSize="small" color="primary" /> : <UncheckedIcon fontSize="small" color="action" />)}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: mine ? 700 : 400,
                      flexGrow: 1,
                      minWidth: 0,
                      wordBreak: "break-word",
                    }}
                  >
                    {option}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>
                    {votes}票
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      ({Math.round(share * 100)}%)
                    </Typography>
                  </Typography>
                </Stack>
              </Box>
            );
            return canAnswer ? (
              <ButtonBase
                key={i}
                disabled={sending}
                onClick={() => toggle(i)}
                aria-pressed={mine}
                sx={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 1,
                }}
              >
                {row}
              </ButtonBase>
            ) : (
              <Box key={i}>{row}</Box>
            );
          })}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          {poll.voters}人が回答
          {canAnswer && (poll.multiple ? " ・ 複数選択できます(タップで選択/解除)" : " ・ タップで回答、もう一度タップで取り消し")}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Collapse>
    </Paper>
  );
}
