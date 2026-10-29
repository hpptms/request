import { useEffect } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PollIcon from "@mui/icons-material/Poll";
import { Link as RouterLink } from "react-router-dom";
import { usePolls } from "../lib/usePolls";
import { PollCard } from "./PollCard";

// The board's アンケート box: every open poll, answerable in place, with a
// link to /polls for the closed ones' results. Renders nothing while no
// poll is open.
export function PollBox({ onLoaded }: { onLoaded?: () => void } = {}) {
  const { polls, loaded, answer } = usePolls();
  useEffect(() => {
    if (loaded) onLoaded?.();
  }, [loaded, onLoaded]);
  const open = polls.filter((p) => !p.closed);
  if (open.length === 0) return null;

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <PollIcon color="primary" />
        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
          アンケート
        </Typography>
        <Button component={RouterLink} to="/polls" size="small" sx={{ whiteSpace: "nowrap" }}>
          過去の結果
        </Button>
      </Stack>
      {open.map((p) => (
        <PollCard key={p.id} poll={p} onAnswer={(choices) => answer(p.id, choices)} />
      ))}
    </Stack>
  );
}
