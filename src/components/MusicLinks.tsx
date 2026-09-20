import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { musicLinks } from "../lib/affiliate";

// 「この曲を探す」リンク。Amazon・楽天は広告(アフィリエイトリンク)で、
// 景品表示法の広告表示と、Amazonアソシエイトの規約上の表記を付ける。
export function MusicLinks({ title }: { title: string }) {
  const links = musicLinks(title);
  if (links.length === 0) return null;
  return (
    <div>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        この曲を探す(Amazon・楽天のリンクは広告です)
      </Typography>
      <Stack useFlexGap direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {links.map((l) => (
          <Button
            key={l.key}
            component="a"
            href={l.href}
            target="_blank"
            rel={l.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
            size="small"
            variant="outlined"
            color="inherit"
            sx={{ whiteSpace: "nowrap" }}
          >
            {l.label}
          </Button>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        Amazonアソシエイトとして、適格販売により収入を得ています。
      </Typography>
    </div>
  );
}
