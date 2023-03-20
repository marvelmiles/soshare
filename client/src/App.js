import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
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
import io from "socket.io-client";
import { API_ENDPOINT } from "config";
import Post from "pages/Post";
import Search from "pages/Search";
import ShortsPage from "pages/ShortsPage";
import Compose from "pages/Compose";
import { createRedirectURL } from "api/http";
import VerificationMail from "pages/VerificationMail";
import ResetPwd from "pages/ResetPwd";

const socket = io.connect(API_ENDPOINT, {
  path: "/mernsocial"
});

const App = () => {
  const [snackbar, setSnackbar] = useState({});
  const [composeDoc, setComposeDoc] = useState();
  const { mode } = useSelector(state => state.config);

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const id = useSelector(state => state.user?.currentUser?.id);
  const { from } = useLocation().state || {};
  useEffect(() => {
    console.log(socket.disconnected, id, " socket disconnected");
    let backHandler;
    if (id) {
      socket.connect();
      socket.emit("register-user", id);
      socket.on("register-user", () => socket.emit("register-user", id));
    }
    // backHandler = e => {
    //   console.log("GOING BACK..", e, from);
    //   e.preventDefault();
    //   if (from === "signin") window.location.href = createRedirectURL();
    // };
    window.addEventListener("popstate", backHandler, false);

    return () => {
      socket.connected && socket.disconnect();
      backHandler && window.removeEventListener("popstate", backHandler, false);
    };
  }, [id, from]);
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
            transition: "all ease-in-out .25s"
          },
          textarea: {
            resize: "none"
          },
          a: {
            textDecoration: "none"
          },
          "html,body,#root": {
            height: "100vh",
            scrollBehavior: "smooth",
            position: "relative",
            backgroundColor: theme.palette.background.default
          },
          ".zoom-in": {
            transform: "scale(1.2) !important",
            transition: "transform 0.2s ease-out, opacity 0.5s ease-out 2s",
            opacity: "0 !important"
          },
          [`
            input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus 
              `]: {
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
          }
        }}
      />
      <context.Provider
        value={{
          setSnackBar,
          socket,
          setComposeDoc,
          composeDoc
        }}
      >
        <Routes path="/">
          <Route index element={<HomePage />} />
          <Route path="post/:id" element={<Post key="posts" />} />
          <Route
            path="comment/:id"
            element={<Post key="comments" kind="comments" />}
          />
          <Route path="search" element={<Search />} />
          <Route path="shorts" element={<ShortsPage />} />
          <Route path="compose">
            <Route path="post" element={<Compose />} />
          </Route>
          <Route path="auth">
            <Route path="signin" element={<Signin />} />
            <Route path="signup" element={<Signup />} />
            <Route path="verification-mail" element={<VerificationMail />} />
            <Route path="reset-password/:token" element={<ResetPwd />} />
          </Route>
          <Route path="u">
            <Route path=":userId" element={<ProfilePage />} />
          </Route>
        </Routes>
      </context.Provider>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 10000}
        onClose={closeSnackBar}
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
