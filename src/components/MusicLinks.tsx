import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";
import { AmazonMark, AppleMusicMark, RakutenMark, SpotifyMark } from "./BrandIcons";
import { hasAffiliateLinks, hasAmazonAffiliate, musicLinks, storeLinks, type MusicLink } from "../lib/affiliate";
import { trackEvent } from "../lib/analytics";

// Fired when a viewer clicks one of the Amazon/楽天/Apple Music/Spotify
// buttons, so GA can show which store and which song/artist keyword it was
// searched for (source distinguishes the two call sites below).
function trackMusicLinkClick(l: MusicLink, keyword: string, source: string) {
  trackEvent("music_link_click", { store: l.key, keyword, affiliate: l.affiliate, source });
}

// Each store's brand colours and mark, so a button reads as that service.
const BRANDS: Record<string, { bg: string; hover: string; fg: string; Icon: ComponentType<SvgIconProps> }> = {
  amazon: { bg: "#FF9900", hover: "#E68A00", fg: "#111111", Icon: AmazonMark },
  rakuten: { bg: "#BF0000", hover: "#A00000", fg: "#FFFFFF", Icon: RakutenMark },
  apple: { bg: "linear-gradient(135deg, #FA233B, #FB5C74)", hover: "linear-gradient(135deg, #E01F35, #EA4F68)", fg: "#FFFFFF", Icon: AppleMusicMark },
  spotify: { bg: "#1DB954", hover: "#1ED760", fg: "#000000", Icon: SpotifyMark },
};

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
        {links.map((l) => {
          const brand = BRANDS[l.key];
          return (
            <Button
              key={l.key}
              component="a"
              href={l.href}
              target="_blank"
              rel={l.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
              onClick={() => trackMusicLinkClick(l, title, "music_links")}
              size="small"
              variant="contained"
              startIcon={brand ? <brand.Icon /> : undefined}
              sx={{
                whiteSpace: "nowrap",
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "none",
                ...(brand && {
                  background: brand.bg,
                  color: brand.fg,
                  "&:hover": { background: brand.hover, boxShadow: "none" },
                }),
              }}
            >
              {l.label}
            </Button>
          );
        })}
      </Stack>
      {hasAmazon && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Amazonアソシエイトとして、適格販売により収入を得ています。
        </Typography>
      )}
    </div>
  );
}

// Small brand-coloured link pills for a stats row (an artist name or an
// already-cleaned title). Ad disclosure is shown once per page via
// AffiliateNotice, not per row.
export function StoreLinksInline({ keyword, withStreaming = false }: { keyword: string; withStreaming?: boolean }) {
  // withStreaming adds the plain Apple Music / Spotify searches after the
  // two store links.
  const links = withStreaming ? musicLinks(keyword) : storeLinks(keyword);
  if (links.length === 0) return null;
  return (
    <Typography variant="caption" component="span" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {links.map((l) => {
        const brand = BRANDS[l.key];
        return (
          <Link
            key={l.key}
            href={l.href}
            target="_blank"
            rel={l.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
            onClick={() => trackMusicLinkClick(l, keyword, "store_links_inline")}
            underline="none"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              px: 0.75,
              py: 0.1,
              borderRadius: 1,
              whiteSpace: "nowrap",
              fontWeight: 700,
              background: brand?.bg,
              color: brand?.fg,
              "&:hover": { background: brand?.hover },
            }}
          >
            {brand && <brand.Icon sx={{ fontSize: 14 }} />}
            {l.label}
          </Link>
        );
      })}
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
