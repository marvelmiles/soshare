import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import { Provider } from "context/store";
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
  getHttpErrMsg,
  createRelativeURL
} from "api/http";
import Auth404 from "pages/404/Auth404";
import Page404 from "pages/404/Page404";
import BrandIcon from "components/BrandIcon";
import EmptyData from "components/EmptyData";
import contextState from "context/contextState";
import { StyledLink } from "components/styled";

let socket;

const App = () => {
  const [snackbar, setSnackbar] = useState({});
  const [context, setContext] = useState(contextState);
  const [readyState, setReadyState] = useState("pending");
  const mode = useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light";
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const cid = useSelector(state => state.user?.currentUser?.id);
  const navigate = useNavigate();
  const { state: locState, key, ...rest } = useLocation();
  const stateRef = useRef({
    isProcUrl: false
  });

  const cancelComposeRequest = useCallback(() => {
    const id = setTimeout(() => {
      setContext(prev => ({ ...prev, composeDoc: undefined }));
      clearTimeout(id);
    }, 0);
  }, []);

  useEffect(() => {
    if (cid) {
      socket = io.connect(API_ENDPOINT, {
        path: "/mernsocial",
        withCredentials: true
      });
    } else {
      socket = io.connect(API_ENDPOINT, {
        path: "/mernsocial"
      });
    }
    const handleRegUser = () =>
      socket.emit("register-user", cid, () => setReadyState("ready"));

    const handleBareConnect = () => {
      console.log(" socket connectd ");
      setReadyState("ready");
    };

    let handlingErr;
    const handleSocketErr = error => {
      console.log(" err ", error.message);
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
        default:
          setReadyState("reject");
          break;
      }
    };

    socket.on("register-user", handleRegUser);
    socket.on("bare-connection", handleBareConnect);
    socket.on("connect_error", handleSocketErr);

    http.interceptors.response.use(
      res => res,
      err => {
        if (socket.connected || readyState !== "pending")
          switch (err) {
            case HTTP_403_MSG:
              if (window.location.pathname.toLowerCase() !== "/auth/signin")
                navigate(
                  createRelativeURL("view", "view=session-timeout", false)
                );
              err = "";
              break;
            default:
              break;
          }

        const t = getHttpErrMsg(err);
        console.log(t, " app err ");
        return Promise.reject(t);
      }
    );

    return () => {
      socket.disconnect();
      socket
        .removeEventListener("register-user", handleRegUser)
        .removeEventListener("bare-connection", handleBareConnect)
        .removeEventListener("connect_error", handleSocketErr);
      setSnackbar(prev => ({ ...prev, open: false }));
      setContext(context => ({
        ...context,
        composeDoc: context.composeDoc?.url ? context.composeDoc : undefined
      }));
      // handleCancelRequest();
    };
  }, [cid, navigate, readyState]);

  useEffect(() => {
    if (cid && context.composeDoc?.url) {
      console.log(context.composeDoc);
      if (context.composeDoc.done) cancelComposeRequest();
      else if (!stateRef.current.isProcUrl) {
        console.log(" is proce... ");
        stateRef.current.isProcUrl = true;
        http[context.composeDoc.method](context.composeDoc.url)
          .then(() => {
            setContext(prev => {
              if (!prev.composeDoc) return prev;
              return {
                ...prev,
                composeDoc: {
                  ...prev.composeDoc,
                  done: true,
                  document: {
                    ...prev.composeDoc.document,
                    ...prev.composeDoc.onSuccess?.()
                  }
                }
              };
            });
          })
          .catch(msg => {
            console.log(msg, " user will manually like ");
            setContext(prev => {
              if (!prev.composeDoc) return prev;
              return {
                ...prev,
                composeDoc: {
                  ...prev.composeDoc,
                  done: true,
                  document: {
                    ...prev.composeDoc.document,
                    ...prev.composeDoc.onError?.()
                  }
                }
              };
            });
          })
          .finally(() => {
            stateRef.current.isProcUrl = undefined;
          });
      }
    }
  }, [cid, context.composeDoc, cancelComposeRequest]);

  const setSnackBar = useCallback(
    (
      snackbar = {
        message: (
          <div>
            You need to{" "}
            <StyledLink
              style={{ textDecoration: "underline" }}
              to={`/auth/signin?redirect=${encodeURIComponent(
                createRelativeURL()
              )}`}
              state={locState}
            >
              login!
            </StyledLink>
          </div>
        ),
        autoHideDuration: 10000
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
    [locState]
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
      <Provider
        value={{
          setSnackBar,
          socket,
          context,
          locState,
          readyState,
          setContext,
          setReadyState
        }}
      >
        {{
          reject: <EmptyData maxWidth="400px" withReload />,
          pending: <BrandIcon hasLoader />
        }[socket ? "pendig" : readyState] || (
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
      </Provider>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 5000}
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
