import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { api } from "../api";
import { PollCard } from "../components/PollCard";
import { fromJstInput, nextSundayEndJst, toJstInput } from "../lib/jstDateTime";
import { visibleInterval } from "../lib/visibleInterval";
import type { Poll } from "../types";

// Mirror backend poll.MaxQuestionRunes / MaxOptionRunes / MaxOptions.
const MAX_QUESTION = 100;
const MAX_OPTION = 40;
const MAX_OPTIONS = 10;

// アンケート管理画面 (/admin/polls): アンケートを作成し、結果を見ながら
// 締切/再開/削除する(backend/internal/poll)。受付中のものは掲示板に表示される。
// 締切日時は日本時間で入力し、初期値は次の日曜23:59。
function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiple, setMultiple] = useState(false);
  // datetime-local value in JST; empty for no deadline.
  const [deadline, setDeadline] = useState(() => toJstInput(nextSundayEndJst()));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<{ polls: Poll[] }>, failure: string) => {
    try {
      setPolls((await action()).polls ?? []);
      setErrorMessage(null);
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : failure);
      return false;
    }
  }, []);

  useEffect(() => {
    run(api.adminListPolls, "取得に失敗しました");
    return visibleInterval(() => {
      api
        .adminListPolls()
        .then(({ polls }) => setPolls(polls ?? []))
        .catch(() => {});
    }, 15000);
  }, [run]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const filled = options.map((o) => o.trim()).filter(Boolean);
    const until = deadline ? fromJstInput(deadline) : undefined;
    if (await run(() => api.adminCreatePoll(question.trim(), filled, multiple, until), "作成に失敗しました")) {
      setQuestion("");
      setOptions(["", ""]);
      setMultiple(false);
      setDeadline(toJstInput(nextSundayEndJst()));
    }
  };

  const setOption = (i: number, value: string) => setOptions((prev) => prev.map((o, j) => (j === i ? value : o)));

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          アンケートを作成
        </Typography>
        <Box component="form" onSubmit={handleCreate}>
          <Stack spacing={1.5}>
            <TextField
              label="質問"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { maxLength: MAX_QUESTION } }}
            />
            {options.map((o, i) => (
              <Stack key={i} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField
                  label={`選択肢${i + 1}`}
                  value={o}
                  onChange={(e) => setOption(i, e.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: MAX_OPTION } }}
                />
                <IconButton
                  aria-label="選択肢を削除"
                  disabled={options.length <= 2}
                  onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
              <Button
                size="small"
                startIcon={<AddIcon />}
                disabled={options.length >= MAX_OPTIONS}
                onClick={() => setOptions((prev) => [...prev, ""])}
              >
                選択肢を追加
              </Button>
              <FormControlLabel
                control={<Checkbox checked={multiple} onChange={(e) => setMultiple(e.target.checked)} />}
                label="複数選択可"
              />
              <TextField
                label="締切(日本時間・空欄で無期限)"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Box sx={{ flexGrow: 1 }} />
              <Button type="submit" variant="contained" disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}>
                作成(すぐに公開)
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          アンケート一覧 {polls.length > 0 && `(${polls.length})`}
        </Typography>
        {polls.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">アンケートはありません</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {polls.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                header={
                  <Stack
                    direction="row"
                    spacing={0.5}
                    useFlexGap
                    sx={{ justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", mb: 1 }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, alignSelf: "center" }}>
                      {new Date(p.createdAt).toLocaleString("ja-JP")} 作成{p.multiple && " ・ 複数選択可"}
                    </Typography>
                    <DeadlineEditor
                      deadline={p.deadline}
                      onSave={(value) =>
                        run(() => api.adminSetPollDeadline(p.id, value ? fromJstInput(value) : null), "締切の変更に失敗しました")
                      }
                    />
                    {p.closed ? (
                      <Tooltip title="再開">
                        <IconButton size="small" onClick={() => run(() => api.adminReopenPoll(p.id), "再開に失敗しました")}>
                          <LockOpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="締め切る">
                        <IconButton size="small" onClick={() => run(() => api.adminClosePoll(p.id), "締切に失敗しました")}>
                          <LockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (window.confirm(`「${p.question}」を削除しますか？回答も消えます。`)) {
                            run(() => api.adminDeletePoll(p.id), "削除に失敗しました");
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

// A poll's deadline as an editable JST datetime-local field, saved with
// its button once changed (cleared for no deadline).
function DeadlineEditor({ deadline, onSave }: { deadline?: string; onSave: (value: string) => void }) {
  const saved = deadline ? toJstInput(deadline) : "";
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <TextField
        label="締切"
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        size="small"
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { style: { fontSize: "0.8rem" } } }}
      />
      {value !== saved && (
        <Button size="small" variant="contained" onClick={() => onSave(value)}>
          保存
        </Button>
      )}
    </Stack>
  );
}

export default AdminPollsPage;
