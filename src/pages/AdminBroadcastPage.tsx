import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CampaignIcon from "@mui/icons-material/Campaign";
import ImageIcon from "@mui/icons-material/Image";
import { api } from "../api";

const MAX_MESSAGE_LENGTH = 200;
// Client-side guard so a large file gets a clear error immediately instead
// of a cryptic failure from the backend's 1MiB JSON body cap — the data:
// URL sent to it is larger than the raw file thanks to base64's ~4/3
// overhead, hence the margin below 1MiB here.
const MAX_IMAGE_BYTES = 700 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("failed to read file"));
    reader.readAsDataURL(file);
  });
}

// 意思表示タブ (/admin/broadcast): 視聴者/再生画面(ViewerPage/RequestSide
// Player)に10秒間、半透明のオーバーレイ+通知音でメッセージまたは画像を
// 表示する(backend/internal/broadcast, useBroadcastOverlay)。表示中に
// 新しく表示すると前のものと入れ替わる — 同時に2つは出せない。
function AdminBroadcastPage() {
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const [sendingImage, setSendingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSent, setImageSent] = useState(false);

  const handleSendMessage = async () => {
    setSendingMessage(true);
    setMessageError(null);
    setMessageSent(false);
    try {
      await api.adminBroadcastMessage(message.trim());
      setMessageSent(true);
      setMessage("");
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so selecting the exact same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    setImageError(null);
    setImageSent(false);
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`画像は${Math.floor(MAX_IMAGE_BYTES / 1024)}KB以下にしてください`);
      return;
    }

    setSendingImage(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await api.adminBroadcastImage(dataUrl);
      setImageSent(true);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSendingImage(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        視聴者・再生画面に10秒間、半透明のオーバーレイと通知音でメッセージまたは画像を表示します。表示中にもう一方を送ると入れ替わります(同時には出せません)。
      </Typography>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CampaignIcon fontSize="small" /> メッセージを表示
          </Typography>
          <TextField
            label="メッセージ"
            multiline
            minRows={2}
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            slotProps={{ htmlInput: { maxLength: MAX_MESSAGE_LENGTH } }}
            helperText={`${message.length}/${MAX_MESSAGE_LENGTH}文字`}
            fullWidth
          />
          {messageError && <Alert severity="error">{messageError}</Alert>}
          {messageSent && <Alert severity="success">送信しました(10秒間表示されます)</Alert>}
          <Box>
            <Button variant="contained" disabled={sendingMessage || message.trim() === ""} onClick={handleSendMessage}>
              {sendingMessage ? "送信中..." : "表示する(10秒)"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ImageIcon fontSize="small" /> 画像を表示
          </Typography>
          <Typography variant="body2" color="text.secondary">
            PNG・JPEG・WebP・GIFに対応しています(最大{Math.floor(MAX_IMAGE_BYTES / 1024)}KB)。
          </Typography>
          {imageError && <Alert severity="error">{imageError}</Alert>}
          {imageSent && <Alert severity="success">送信しました(10秒間表示されます)</Alert>}
          <Box>
            <Button variant="contained" component="label" disabled={sendingImage}>
              {sendingImage ? "送信中..." : "画像を選んで表示する(10秒)"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleSelectImage}
              />
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default AdminBroadcastPage;
