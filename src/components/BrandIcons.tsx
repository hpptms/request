import SvgIcon from "@mui/material/SvgIcon";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import AppleIcon from "@mui/icons-material/Apple";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

// Simple marks (not the official logos) that make each store's button
// recognisable at a glance next to its brand colour.

export function AmazonMark(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <text x="12" y="14" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="Arial, sans-serif" fill="currentColor">
        a
      </text>
      <path d="M4 17c5 3 11 3 16 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 14.5l3 2-3.2 1.6z" fill="currentColor" />
    </SvgIcon>
  );
}

export function RakutenMark(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <text x="12" y="19" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="Arial, sans-serif" fill="currentColor">
        R
      </text>
    </SvgIcon>
  );
}

export function SpotifyMark(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <g fill="none" stroke="#1DB954" strokeLinecap="round">
        <path d="M6.5 9.3c3.7-1.1 8.2-.8 11.4 1.2" strokeWidth="1.9" />
        <path d="M7.2 12.6c3-.9 6.6-.6 9.2 1" strokeWidth="1.6" />
        <path d="M7.9 15.6c2.4-.6 5-.4 7.2.9" strokeWidth="1.3" />
      </g>
    </SvgIcon>
  );
}

export function AppleMusicMark(props: SvgIconProps) {
  return <MusicNoteIcon {...props} />;
}

// ニコニコ動画: the TV set with antennae that its logo is built around.
export function NiconicoMark(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <path d="M8 3.5l4 3.5 4-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2.5" y="7" width="19" height="13.5" rx="3.5" fill="currentColor" />
      <rect x="5" y="9.5" width="10.5" height="8.5" rx="2" fill="#252525" />
      <circle cx="18.6" cy="12" r="1.1" fill="#252525" />
      <circle cx="18.6" cy="15.6" r="1.1" fill="#252525" />
    </SvgIcon>
  );
}

// FC2 live: the bold "FC2" wordmark.
export function Fc2Mark(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <text x="12" y="16.5" textAnchor="middle" fontSize="11.5" fontWeight="900" fontFamily="Arial, sans-serif" fill="currentColor">
        FC2
      </text>
    </SvgIcon>
  );
}

export { AppleIcon };
