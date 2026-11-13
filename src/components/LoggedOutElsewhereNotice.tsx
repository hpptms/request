import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { Link as RouterLink } from "react-router-dom";
import { dismissLoggedOutElsewhere, useLoggedOutElsewhere } from "../lib/account";

// Shown once this browser was logged out because the same user ID logged in
// on another browser (only one at a time may use an account).
export function LoggedOutElsewhereNotice() {
  const open = useLoggedOutElsewhere();
  return (
    <Snackbar open={open} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
      <Alert
        severity="warning"
        variant="filled"
        onClose={dismissLoggedOutElsewhere}
        action={
          <Button color="inherit" size="small" component={RouterLink} to="/account?tab=login" onClick={dismissLoggedOutElsewhere}>
            ログイン
          </Button>
        }
      >
        別の端末で同じユーザーIDにログインされたため、ログアウトしました
      </Alert>
    </Snackbar>
  );
}
