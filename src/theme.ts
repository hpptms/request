import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff0000" },
    background: { default: "#0f0f0f", paper: "#181818" },
  },
  shape: { borderRadius: 10 },
});
