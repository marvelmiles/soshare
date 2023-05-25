import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles
} from "@mui/material";
import { themeSettings, INPUT_AUTOFILL_SELECTOR } from "theme";
import { useSelector } from "react-redux";
import HomePage from "pages/HomePage";
import ProfilePage from "pages/ProfilePage";
import Signin from "pages/Signin";
import Signup from "pages/Signup";
import { context } from "context/store";
import { Snackbar, useMediaQuery, Button, Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import io from "socket.io-client";
import { API_ENDPOINT, HTTP_403_MSG } from "context/config";
import Post from "pages/Post";
import Search from "pages/Search";
import ShortsPage from "pages/ShortsPage";
import VerificationMail from "pages/VerificationMail";
import ResetPwd from "pages/ResetPwd";
import http, {
  handleCancelRequest,
  handleRefreshToken,
  getHttpErrMsg
} from "api/http";
import Auth404 from "pages/404/Auth404";
import Page404 from "pages/404/Page404";
import BrandIcon from "components/BrandIcon";
import EmptyData from "components/EmptyData";
import Comments from "components/Comments";
import { reloadBrowser } from "utils";

const socket = io.connect(API_ENDPOINT, {
  path: "/mernsocial",
  withCredentials: window.location.pathname !== "/auth/signin"
});

const App = () => {
  const [snackbar, setSnackbar] = useState({});
  const [composeDoc, setComposeDoc] = useState();
  const [readyState, setReadyState] = useState("pending");
  const mode = useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light";
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const cid = useSelector(state => state.user?.currentUser?.id);
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();
    if (cid) {
      socket.on("register-user", () =>
        socket.emit("register-user", cid, () => setReadyState("ready"))
      );
    } else setReadyState("ready");
    socket.on("comment", comment => setComposeDoc(comment));
    socket.on("filter-comment", comment => setComposeDoc(comment));
    let handlingErr;
    socket.on("connect_error", error => {
      if (handlingErr) return;
      handlingErr = true;
      switch (error.message) {
        case "Token expired or isn't valid":
          handleRefreshToken()
            .then(() => socket.connect())
            .catch(() => setReadyState("403"))
            .finally(() => {
              handlingErr = undefined;
            });
          break;
        case "xhr poll error":
          setReadyState("reject");
          break;
        default:
          break;
      }
    });
    return () => {
      socket.connected && socket.disconnect();
      handleCancelRequest();
    };
  }, [cid]);

  useEffect(() => {
    http.interceptors.response.use(
      res => res,
      err => {
        if (socket.connected || readyState !== "pending")
          switch (err) {
            case HTTP_403_MSG:
              if (
                cid &&
                window.location.pathname.toLowerCase() !== "/auth/signin"
              )
                navigate("?view=session-timeout");
              break;
            default:
              break;
          }
        return Promise.reject(getHttpErrMsg(err));
      }
    );
  }, [navigate, readyState, cid]);

  const setSnackBar = useCallback(
    (
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
      }),
    []
  );
  const closeSnackBar = () =>
    setSnackbar({
      ...snackbar,
      open: false
    });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          "*": {
            fontFamily: `'Rubik', sans-serif`
          },
          textarea: {
            resize: "none",
            background: "transparent"
          },
          a: {
            textDecoration: "none"
          },
          "html,body,#root": {
            minHeight: "100vh",
            scrollBehavior: "smooth",
            position: "relative",
            backgroundColor: theme.palette.background.default
          },
          ".zoom-in": {
            transform: "scale(1.2) !important",
            transition: "transform 0.2s ease-out, opacity 0.5s ease-out 2s",
            opacity: "0 !important"
          },
          [INPUT_AUTOFILL_SELECTOR]: {
            backgroundColor: "transparent",
            transition: "background-color 5000s ease-in-out 0s",
            textFillColor: theme.palette.text.primary,
            caretColor: theme.palette.text.primary
          },
          "html .MuiButtonBase-root.Mui-disabled": {
            cursor: "not-allowed"
          },
          "html .MuiInputBase-input::placeholder": {
            opacity: "1"
          },
          input: {
            background: "transparent"
          },
          "html .MuiButton-contained": {
            color: theme.palette.common.white
          }
        }}
      />
      <context.Provider
        value={{
          setSnackBar,
          socket,
          setComposeDoc,
          composeDoc,
          readyState,
          setReadyState
        }}
      >
        {{
          reject: (
            <EmptyData
              maxWidth="400px"
              label={
                <div>
                  <BrandIcon staticFont sx={{ mb: 1 }} />
                  <Typography variant="h5">
                    Something went wrong, but don’t fret — let’s give it another
                    shot.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={reloadBrowser}
                  >
                    Try again
                  </Button>
                </div>
              }
            />
          ),
          pending: <BrandIcon hasLoader />
        }[readyState] || (
          <Routes path="/">
            <Route index element={<HomePage />} />
            <Route path="/auth">
              <Route path="signin" element={<Signin />} />
              <Route path="signup" element={<Signup />} />
              <Route path="*" element={<Auth404 />} />
            </Route>
            <Route path="u/:userId" element={<ProfilePage />} />
            <Route path="search" element={<Search />} />
            <Route path="shorts" element={<ShortsPage />} />
            <Route path="verification-mail" element={<VerificationMail />} />
            <Route
              path="reset-password"
              element={<ResetPwd setSnackBar={setSnackBar} />}
            />
            <Route path=":kind/:id" element={<Post />} />
            <Route path="*" element={<Page404 />} />
          </Routes>
        )}
      </context.Provider>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 10000}
        onClose={closeSnackBar}
        sx={{ maxWidth: "500px" }}
      >
        <Alert
          severity={snackbar.severity || "error"}
          action={
            snackbar.handleClose || true ? (
              <CloseIcon onClick={closeSnackBar} />
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
