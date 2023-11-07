import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams
} from "react-router-dom";
import { ThemeProvider, CssBaseline, GlobalStyles } from "@mui/material";
import { createTheme, INPUT_AUTOFILL_SELECTOR, fontFamily } from "theme";
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
import { SERVER_ORIGIN } from "context/constants";
import Post from "pages/Post";
import Search from "pages/Search";
import ShortsPage from "pages/ShortsPage";
import VerificationMail from "pages/VerificationMail";
import ResetPwd from "pages/ResetPwd";
import http, { handleRefreshToken, createRelativeURL } from "api/http";
import Auth404 from "pages/404/Auth404";
import Page404 from "pages/404/Page404";
import BrandIcon from "components/BrandIcon";
import EmptyData from "components/EmptyData";
import contextState from "context/contextState";
import { StyledLink } from "components/styled";
import { HTTP_401_MSG } from "context/constants";
import { setThemeMode } from "context/slices/configSlice";
import { useDispatch } from "react-redux";

// minor issues for now

// in edit media page -> delete a media doesnt'work as expected.
// infiniteFetch get data in pagination format rather than standard format

let socket;

const App = () => {
  const [snackbar, setSnackbar] = useState({});
  const [context, setContext] = useState(contextState);
  const [readyState, setReadyState] = useState("pending");
  const configMode = useSelector(state => state.config.mode);
  const [isOnline, setIsOnline] = useState(undefined);

  const {
    id: cid,
    settings: { theme: userThemeMode }
  } = useSelector(state => state.user.currentUser);

  const systemMode = useMediaQuery("(prefers-color-scheme: dark)")
    ? "dark"
    : "light";

  const isSystemMode = userThemeMode === "system";

  const [theme, setTheme] = useState(
    createTheme(isSystemMode ? systemMode : userThemeMode)
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();

  let { userId = "", kind = "", id = "" } = useParams();

  userId = userId || cid;

  let { state: locState, pathname, key } = useLocation();
  pathname = pathname.toLowerCase();
  locState = locState || {
    from: undefined, // 0 = ignore
    document: {}, // Post|Comment|Short
    docSet: {}, // key = docId and value = formData
    docType: "",
    reason: ""
  };

  const stateRef = useRef({
    isProcUrl: false,
    prevPath: "",
    defaultPage: pathname
  });

  const resetComposeDoc = useCallback(() => {
    const id = setTimeout(() => {
      setContext(prev => ({ ...prev, composeDoc: undefined }));
      clearTimeout(id);
    }, 0);
  }, []);

  useEffect(() => {
    const prop = {
      path: "/soshare"
    };

    if (cid) {
      socket = io.connect(SERVER_ORIGIN, {
        ...prop,
        withCredentials: true
      });
    } else {
      socket = io.connect(SERVER_ORIGIN, prop);
    }

    const handleRegUser = () =>
      socket.emit("register-user", cid, () => setReadyState("ready"));

    const handleBareConnect = () => setReadyState("ready");

    const showSessionTimeout = () =>
      cid &&
      window.location.pathname.toLowerCase() !== "/auth/signin" &&
      navigate(
        createRelativeURL(undefined, "view=session-timeout", {
          view: "cv"
        })
      );

    let handlingErr;

    const handleSocketErr = error => {
      if (handlingErr) return;
      handlingErr = true;
      switch (error.message) {
        case HTTP_401_MSG:
          handleRefreshToken()
            .then(() => socket.connect())
            .catch(showSessionTimeout)
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
        switch (err.status) {
          case 403:
            if (!(window.location.pathname.toLowerCase().indexOf("auth") > -1))
              showSessionTimeout();
            break;
          default:
            break;
        }

        return Promise.reject(err);
      }
    );

    setSnackbar(prev => ({ ...prev, open: false }));
    // setContext(context => ({
    //   ...context,
    //   composeDoc: context.composeDoc?.url ? context.composeDoc : undefined
    // }));

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
    dispatch(setThemeMode(isSystemMode ? systemMode : userThemeMode));
  }, [dispatch, systemMode, isSystemMode, userThemeMode]);

  const setSnackBar = useCallback(
    (snackbar = {}, docSet) => {
      if (!snackbar.message) {
        const stateProp = {
          docSet: cid ? undefined : docSet
        };

        docSet &&
          navigate(createRelativeURL(), {
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

  const isDefaultPage = pathname === stateRef.current.defaultPage;

  return (
    <div id="app-root">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "*": {
              fontFamily,
              // remove blue highlight on element click in touchscreens
              tapHighlightColor: "rgba(255, 255, 255, 0) !important",
              WebkitTapHighlightColor: "rgba(255,255,255,0) !important",
              outline: "none !important",
              touchCallout: "none !important",
              WebkitTouchCallout: "none !important"
            },
            textarea: {
              resize: "none",
              background: "transparent"
            },
            a: {
              textDecoration: "none",
              outline: "none"
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
              color: theme.palette.common.white,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.palette.common.blendHover,
              ".MuiTypography-root": {
                maxWidth: "280px",
                margin: "0 auto",
                fontSize: "1.2em",
                padding: "0px 8px"
              }
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
            // ".content-inherit": {
            //   minWidth: "inherit",
            //   minHeight: "inherit",
            //   maxHeight: "inherit",
            //   maxWidth: "inherit",
            //   height: "inherit",
            //   width: "inherit",
            //   border: "inherit",
            //   borderRadius: "inherit",
            //   color: "inherit"
            // },
            ".custom-media-container": {
              width: "100%",
              height: "100%",
              maxHeight: "inherit",
              minHeight: "inherit",
              overflow: "hidden",
              position: "relative",
              backgroundColor: theme.palette.common.black,
              borderRadius: "inherit",
              border: "1px solid currentColor",
              borderColor: theme.palette.divider,
              paddingBottom: "56.25%",
              ".custom-overlay": {
                position: "absolute"
              }
            }
          }}
        />
        <Provider
          value={{
            setSnackBar,
            userId,
            socket,
            context,
            locState,
            readyState,
            isOnline,
            isLoggedIn: !!cid,
            withBackBtn:
              !isDefaultPage &&
              key !== "default" &&
              locState.from !== 0 &&
              (pathname.indexOf("auth") === -1 && pathname !== "/"),
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
                  maxWidth="350px"
                  withReload
                />
              ),
              pending: <BrandIcon hasLoader />,
              ready: (
                <Routes path="/">
                  <Route index element={<HomePage />} />
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
                  <Route
                    path="u/:userId"
                    element={<ProfilePage key={userId} />}
                  />
                  <Route path="search" element={<Search />} />
                  <Route path="shorts" element={<ShortsPage />} />
                  <Route path=":kind/:id" element={<Post key={kind + id} />} />
                  <Route path="*" element={<Page404 />} />
                </Routes>
              )
            }[readyState]
          }
        </Provider>
      </ThemeProvider>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 8000}
        onClose={snackbar.onClose ? snackbar.onClose : closeSnackBar}
        sx={{
          bottom: isOnline === undefined ? undefined : "80px !important",
          maxWidth: snackbar.maxWidth || "400px",
          "&::first-letter": {
            textTransform: "uppercase"
          }
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
