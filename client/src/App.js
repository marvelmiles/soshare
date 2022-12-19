import React, { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles
} from "@mui/material";
import { themeSettings } from "theme";
import { useSelector } from "react-redux";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HomePage from "pages/HomePage";
import ProfilePage from "pages/ProfilePage";
import Signin from "pages/Signin";
import UserProfileForm from "components/UserProfileForm";
import Signup from "pages/Signup";
import { context } from "redux/store";
import { Snackbar } from "@mui/material";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
const App = () => {
  const [snackbar, setSnackbar] = useState({});
  const { mode } = useSelector(state => state.config);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const setSnackBar = (
    snackbar = {
      message: "You need to login"
    }
  ) =>
    setSnackbar({
      open: true,
      ...(snackbar.message
        ? snackbar
        : {
            message: snackbar
          })
    });
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "*": {
              transition: "all ease-in-out .25s"
            },
            textarea: {
              resize: "none"
            }
          }}
        />
        <context.Provider
          value={{
            setSnackBar
          }}
        >
          <Routes path="/">
            <Route index element={<HomePage />} />
            <Route path="auth">
              <Route path="signin" element={<Signin />} />
              <Route path="signup" element={<Signup />} />
            </Route>
            <Route path="u">
              <Route path=":userId" element={<ProfilePage />} />
            </Route>
          </Routes>
        </context.Provider>
      </BrowserRouter>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 5000}
      >
        <Alert
          autoHideDuration={snackbar.autoHideDuration || 5000}
          severity={snackbar.severity || "error"}
          action={
            snackbar.handleClose | true ? (
              <CloseIcon
                onClick={() =>
                  setSnackbar({
                    ...snackbar,
                    open: false
                  })
                }
              />
            ) : (
              undefined
            )
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;
