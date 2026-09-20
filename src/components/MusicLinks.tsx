import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { hasAffiliateLinks, hasAmazonAffiliate, musicLinks, storeLinks } from "../lib/affiliate";

// 「この曲を探す」リンク。Amazon・楽天は広告(アフィリエイトリンク)で、
// 景品表示法の広告表示と、Amazonアソシエイトの規約上の表記を付ける。
export function MusicLinks({ title }: { title: string }) {
  const links = musicLinks(title);
  if (links.length === 0) return null;
  const hasAffiliate = links.some((l) => l.affiliate);
  const hasAmazon = links.some((l) => l.key === "amazon" && l.affiliate);
  return (
    <div>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        この曲を探す{hasAffiliate && "(Amazon・楽天のリンクは広告です)"}
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
            sx={{ whiteSpace: "nowrap", textTransform: "none" }}
          >
            {l.label}
          </Button>
        ))}
      </Stack>
      {hasAmazon && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Amazonアソシエイトとして、適格販売により収入を得ています。
        </Typography>
      )}
    </div>
  );
}

// Small "Amazon / 楽天" text links for a stats row (an artist name or an
// already-cleaned title). Ad disclosure is shown once per page via
// AffiliateNotice, not per row.
export function StoreLinksInline({ keyword }: { keyword: string }) {
  const links = storeLinks(keyword);
  if (links.length === 0) return null;
  return (
    <Typography variant="caption" component="span" sx={{ display: "inline-flex", gap: 1.5, whiteSpace: "nowrap" }}>
      {links.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          target="_blank"
          rel={l.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
          underline="hover"
        >
          {l.key === "amazon" ? "Amazon" : "楽天"}
        </Link>
      ))}
    </Typography>
  );
}

// The page-level ad disclosure that goes with StoreLinksInline.
export function AffiliateNotice() {
  if (!hasAffiliateLinks) return null;
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
      各行の「Amazon」「楽天」のリンクは広告です。{hasAmazonAffiliate && "Amazonアソシエイトとして、適格販売により収入を得ています。"}
    </Typography>
  );
}
