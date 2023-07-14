import React, { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider, CssBaseline, GlobalStyles } from "@mui/material";
import { createTheme, INPUT_AUTOFILL_SELECTOR } from "theme";
import { useSelector } from "react-redux";
import HomePage from "pages/HomePage";
import ProfilePage from "pages/ProfilePage";
import Signin from "pages/Signin";
import Signup from "pages/Signup";
import { Provider } from "context/store";
import { Snackbar, useMediaQuery } from "@mui/material";
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
import { TOKEN_EXPIRED_MSG } from "context/config";
import { setThemeMode } from "context/slices/configSlice";
import { useDispatch } from "react-redux";
import PlayGround from "PlayGround";

let socket;

const App = () => {
  const [snackbar, setSnackbar] = useState({});
  const [context, setContext] = useState(contextState);
  const [readyState, setReadyState] = useState("pending");
  const configMode = useSelector(state => state.config.mode);
  const [isOnline, setIsOnline] = useState(undefined);
  const systemMode = useMediaQuery("(prefers-color-scheme: dark)")
    ? "dark"
    : "light";
  const [theme, setTheme] = useState(createTheme(systemMode));
  const cid = useSelector(state => state.user.currentUser.id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state: locState } = useLocation();
  const stateRef = useRef({
    isProcUrl: false,
    prevPath: "",
    currentPath: ""
  });
  stateRef.current.locState = locState;
  const resetComposeDoc = useCallback(() => {
    const id = setTimeout(() => {
      setContext(prev => ({ ...prev, composeDoc: undefined }));
      clearTimeout(id);
    }, 0);
  }, []);

  useEffect(() => {
    const stateCtx = stateRef.current;
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

    const handleBareConnect = () => setReadyState("ready");

    let handlingErr;
    const handleSocketErr = error => {
      if (handlingErr) return;
      handlingErr = true;
      switch (error.message) {
        case TOKEN_EXPIRED_MSG:
          handleRefreshToken()
            .then(() => socket.connect())
            .catch(() =>
              cid
                ? navigate(
                    createRelativeURL("view", "view=session-timeout", false)
                  )
                : null
            )
            .finally(() => {
              setReadyState("ready");
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
        switch (err) {
          case HTTP_403_MSG:
            if (
              cid &&
              window.location.pathname.toLowerCase() !== "/auth/signin" &&
              window.location.search.indexOf("session-timeout") === -1
            )
              navigate(
                createRelativeURL("view", "view=session-timeout", false)
              );
            err = "";
            break;
          default:
            break;
        }
        return Promise.reject(getHttpErrMsg(err));
      }
    );

    const path = createRelativeURL();
    if (stateCtx.currentPath !== path) {
      if (stateCtx.currentPath.indexOf("auth") > -1) {
        stateRef.current.prevPath = "";
        stateRef.current.hasAuthPath = true;
      } else if (stateRef.current.hasAuthPath) {
        stateRef.current.prevPath = "";
        stateRef.current.hasAuthPath = false;
      } else stateCtx.prevPath = stateCtx.currentPath;
      stateCtx.currentPath = path.toLowerCase();
    }
    setSnackbar(prev => ({ ...prev, open: false }));
    setContext(context => ({
      ...context,
      composeDoc: context.composeDoc?.url ? context.composeDoc : undefined
    }));

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (socket)
        socket
          .disconnect()
          .removeEventListener("register-user", handleRegUser)
          .removeEventListener("bare-connection", handleBareConnect)
          .removeEventListener("connect_error", handleSocketErr);

      handleCancelRequest();

      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [cid, navigate]);

  useEffect(() => {
    if (cid && context.composeDoc?.url) {
      if (context.composeDoc.done) resetComposeDoc();
      else if (!stateRef.current.isProcUrl) {
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
          .catch(_ => {
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
  }, [cid, context.composeDoc, resetComposeDoc]);

  useEffect(() => {
    setTheme(createTheme(configMode));
  }, [configMode]);

  useEffect(() => {
    dispatch(setThemeMode(systemMode));
  }, [dispatch, systemMode]);

  const setSnackBar = useCallback(
    (
      snackbar = {
        autoHideDuration: 10000
      },
      outInput
    ) => {
      if (!snackbar.message) {
        const stateProp =
          stateRef.current.locState || outInput
            ? {
                ...stateRef.current.locState,
                outInputs: cid
                  ? undefined
                  : {
                      ...stateRef.current.locState?.outInputs,
                      ...outInput
                    }
              }
            : undefined;
        outInput &&
          navigate("/?compose=comment", {
            state: stateProp
          });
        if (typeof snackbar !== "string" && !snackbar.message)
          snackbar.message = (
            <div>
              You need to{" "}
              <StyledLink
                style={{ textDecoration: "underline" }}
                to={`/auth/signin?redirect=${encodeURIComponent(
                  createRelativeURL()
                )}`}
                state={stateProp}
              >
                login!
              </StyledLink>
            </div>
          );
      }
      setSnackbar({
        open: true,
        ...(snackbar.message
          ? snackbar
          : {
              message: snackbar
            })
      });
    },
    [cid, navigate]
  );
  const closeSnackBar = useCallback(() => {
    setSnackbar(prev =>
      prev.open
        ? {
            ...prev,
            open: false
          }
        : prev
    );
  }, []);

  const closeIsOnlineSnackBar = () => setIsOnline(undefined);

  const _isOnline = isOnline === undefined ? window.navigator.onLine : isOnline;

  return (
    <div id="app-root">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "*": {
              fontFamily: "'Rubik', sans-serif"
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
            },
            ".custom-overlay": {
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.palette.common.blend,
              height: "100%",
              maxHeight: "inherit",
              minHeight: "100%",
              width: "100%",
              maxWidth: "inherit",
              minWidth: "100%",
              textAlign: "center",
              border: "inherit",
              borderRadius: "inherit",
              zIndex: 2,
              cursor: "default",
              color: theme.palette.common.white
            },
            ".textarea-readOnly": {
              resize: "none",
              width: "100%",
              color: theme.palette.text.primary,
              height: "auto",
              maxHeight: "none",
              overflow: "hidden",
              whiteSpace: "pre-line",
              wordBreak: "break-word"
            },
            ".custom-media": {
              maxHeight: "100%",
              maxWidth: "100%",
              minHeight: "100%",
              minWidth: "100%",
              width: "100%",
              height: "100%",
              position: "absolute",
              top: "0",
              left: "0",
              objectFit: "fill",
              outline: 0
            },
            ".content-inherit": {
              minWidth: "inherit",
              minHeight: "inherit",
              maxHeight: "inherit",
              maxWidth: "inherit",
              height: "inherit",
              width: "inherit",
              border: "inherit",
              borderRadius: "inherit",
              color: "inherit"
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
            prevPath: stateRef.current.prevPath
              ? stateRef.current.prevPath
              : "",
            currentPath: stateRef.current.currentPath,
            setContext,
            setReadyState,
            closeSnackBar
          }}
        >
          {
            {
              reject: (
                <EmptyData
                  sx={{ minHeight: "100vh" }}
                  maxWidth="400px"
                  withReload
                />
              ),
              pending: <BrandIcon hasLoader />,
              ready: (
                <Routes path="/">
                  <Route index element={<HomePage />} />
                  <Route path="playground" element={<PlayGround />} />
                  <Route path="/auth">
                    <Route path="signin" element={<Signin />} />
                    <Route path="signup" element={<Signup />} />
                    <Route
                      path="verification-mail"
                      element={<VerificationMail />}
                    />
                    <Route
                      path="reset-password/:token/:userId"
                      element={<ResetPwd setSnackBar={setSnackBar} />}
                    />
                    <Route path="*" element={<Auth404 />} />
                  </Route>
                  <Route path="u/:userId" element={<ProfilePage />} />
                  <Route path="search" element={<Search />} />
                  <Route path="shorts" element={<ShortsPage />} />
                  <Route path=":kind/:id" element={<Post />} />
                  <Route path="*" element={<Page404 />} />
                </Routes>
              )
            }[readyState]
          }
        </Provider>
      </ThemeProvider>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={
          snackbar.autoHideDuration ||
          (snackbar.severity === "success" ? 5000 : 10000)
        }
        onClose={
          snackbar.onClose === undefined ? closeSnackBar : snackbar.onClose
        }
        sx={{
          bottom: isOnline === undefined ? undefined : "80px !important",
          maxWidth: "500px"
        }}
      >
        <Alert
          severity={snackbar.severity || "error"}
          action={
            <CloseIcon sx={{ cursor: "pointer" }} onClick={closeSnackBar} />
          }
          sx={{
            whiteSpace: "pre-line"
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Snackbar
        key={isOnline + "-online"}
        open={isOnline !== undefined}
        autoHideDuration={5000}
        onClose={closeIsOnlineSnackBar}
      >
        <Alert
          severity={_isOnline ? "success" : "warning"}
          action={
            <CloseIcon
              sx={{ cursor: "pointer" }}
              onClick={closeIsOnlineSnackBar}
            />
          }
        >
          You are currently {_isOnline ? "online" : "offline"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default App;
