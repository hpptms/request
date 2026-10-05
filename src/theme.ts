import { createTheme } from "@mui/material/styles";

// #ff0000 alone can't meet WCAG AA (4.5:1) both as a background under white
// text (4.0:1) and as text on the dark paper #181818 (4.44:1), so filled
// primary surfaces use a slightly darker red and primary text a slightly
// lighter one (PageSpeed Insights' color-contrast audit).
const FILLED_RED = "#dd0000"; // white on it: 5.15:1
const TEXT_RED = "#ff3333"; // on #181818: 4.88:1

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff0000" },
    background: { default: "#0f0f0f", paper: "#181818" },
  },
  shape: { borderRadius: 10 },
  components: {
    // MUI maps subtitle1/2 to <h6> by default, which made small labels like
    // "NOW LIVE" / "今日のテーマ" count as headings and broke heading order.
    MuiTypography: {
      defaultProps: {
        variantMapping: { subtitle1: "p", subtitle2: "p" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          variants: [
            { props: { color: "primary", variant: "filled" }, style: { backgroundColor: FILLED_RED } },
          ],
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          variants: [
            { props: { color: "primary", variant: "text" }, style: { color: TEXT_RED } },
            { props: { color: "primary", variant: "outlined" }, style: { color: TEXT_RED } },
            {
              props: { color: "primary", variant: "contained" },
              style: { backgroundColor: FILLED_RED, "&:hover": { backgroundColor: "#c00000" } },
            },
          ],
        },
      },
    },
  },
});
