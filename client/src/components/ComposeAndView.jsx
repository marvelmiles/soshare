import React, { useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import InputBox from "components/InputBox";
import IconButton from "@mui/material/IconButton";
import PostWidget from "components/PostWidget";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import PostsView from "views/PostsView";
import ShortsView from "views/ShortsView";
import {
  useLocation,
  useSearchParams,
  Navigate,
  useNavigate
} from "react-router-dom";
import { useContext } from "context/store";
import FollowMeWidget from "components/FollowMeWidget";
import Comments from "components/Comments";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { LoadingDot } from "components/Loading";
import UserBlacklistView from "views/UserBlacklistView";
import { handleCancelRequest } from "api/http";
import SessionTimeout from "./SessionTimeout";
Dialog.defaultProps = {
  open: false
};

const ComposeAndView = ({ openFor, uid, isCurrentUser }) => {
  openFor = {
    "create-post": true,
    "create-short": true,
    "user-shorts": true,
    "user-posts": true,
    "user-following": true,
    "user-followers": true,
    "user-blacklist": true,
    "session-timeout": true,
    comments: true,
    comment: true,
    ...openFor
  };
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const stateRef = useRef({
    commentHolder: {}
  });
  const [context, setContext] = useState({});
  const { setComposeDoc } = useContext();
  const view = (searchParams.get("view") || "").toLowerCase();
  const compose = (searchParams.get("compose") || "").toLowerCase();
  const cid = searchParams.get("cid") || "";
  const scrollNodeRef = useRef();
  const navigate = useNavigate();

  const closeDialog = useCallback(
    e => {
      e && e.stopPropagation();
      if (view === "session-timeout") return;
      if (stateRef.current.path) handleCancelRequest(stateRef.current.path);
      setContext({});
      navigate(-1);
    },
    [navigate, view]
  );

  const _handleAction = useCallback(
    (reason, res, info) => {
      const addComment = () => {
        stateRef.current.path = undefined;
        res.reason = reason;
        if (!res.docType && state) res.docType = state.docType;
        setComposeDoc(res);
        closeDialog();
      };
      switch (reason) {
        case "error":
          stateRef.current.path = undefined;
          return;
        case "temp-data":
          stateRef.current.path = info;
          return;
        case "new":
          addComment();
          break;
        case "update":
          if (compose === "comment") addComment();
          break;
        case "context":
          setContext(context => ({
            ...context,
            ...res
          }));
          break;
        default:
          break;
      }
    },
    [closeDialog, setComposeDoc, state, compose]
  );
  const renderDialog = key => {
    if (!key) return;
    DialogContent.defaultProps = {
      ref: scrollNodeRef
    };
    const goBackElem = (
      <IconButton
        title="Go back"
        onClick={e => {
          e.stopPropagation();
          navigate(-1);
        }}
      >
        <KeyboardBackspaceIcon />
      </IconButton>
    );
    switch (key) {
      case "create-post":
      case "create-short":
        const fileId = `${key}-file-picker`;
        return (
          <>
            <DialogTitle component={Stack}>
              <Stack>
                {goBackElem}
                {context.processing ? (
                  <Typography variant="h5" fontWeight="bold">
                    <LoadingDot />
                  </Typography>
                ) : (
                  <div>
                    <Typography variant="h5" fontWeight="bold" mb={0}>
                      Share your moment
                    </Typography>
                    {key === "create-short" ? (
                      <Typography
                        htmlFor={fileId}
                        component="label"
                        variant="caption"
                        sx={{
                          color: "error.main",
                          "&:hover": {
                            textDecoration: "underline",
                            cursor: "pointer"
                          }
                        }}
                      >
                        Select a video!
                      </Typography>
                    ) : null}
                  </div>
                )}
              </Stack>
              <IconButton
                sx={{
                  backgroundColor: "action.selected"
                }}
                onClick={closeDialog}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {{
                "create-short": (
                  <InputBox
                    key={fileId}
                    fileId={fileId}
                    showIndicator={false}
                    showActionBar={false}
                    multiple={false}
                    accept="video"
                    url="/shorts/new"
                    mediaRefName="short"
                    max={40}
                    videoPlayerProps={{
                      withIntersection: false
                    }}
                    required={{
                      short: "You need to select a video!"
                    }}
                    handleAction={_handleAction}
                    placeholder="#Short_Description"
                    maxUpload="500mb"
                    maxDuration="60s"
                  />
                )
              }[key] || (
                <InputBox
                  key={fileId}
                  handleAction={_handleAction}
                  videoPlayerProps={{
                    withIntersection: false
                  }}
                  handleAction={_handleAction}
                />
              )}
            </DialogContent>
          </>
        );
      case "comment":
        if (state.composeDoc.id !== stateRef.current.commentHolder.document)
          stateRef.current.commentHolder = {
            document: state.composeDoc.id
          };

        return (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid currentColor",
                borderColor: "divider"
              }}
            >
              <Stack>
                {goBackElem} {context.processing ? <LoadingDot /> : null}
              </Stack>
              <Typography color="primary.main">{34} views</Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <PostWidget post={state.composeDoc} enableSnippet />
              <InputBox
                resetData
                method="post"
                accept=".jpg,.jpeg,.png,.gif"
                url={`/comments/new/${state.docType || "post"}?ro=${
                  state.composeDoc.user.id
                }`}
                placeholder="Send your opinion"
                actionText="Reply"
                mediaRefName="media"
                multiple={false}
                message={{
                  success: `Added comment successfully`
                }}
                placeholders={stateRef.current.commentHolder}
                max={280}
                sx={{
                  minHeight: 0
                }}
                handleAction={_handleAction}
              />
            </DialogContent>
          </>
        );
      case "user-shorts":
      case "user-posts":
        return (
          <>
            <DialogContent
              sx={{
                p: 0
              }}
            >
              {
                {
                  "user-posts": (
                    <PostsView
                      privateView
                      plainWidget
                      url={`/users/${uid}/posts`}
                      sx={{
                        p: 0,
                        pb: 3
                      }}
                      scrollNodeRef={scrollNodeRef}
                    />
                  ),
                  "user-shorts": (
                    <ShortsView
                      privateView
                      hideDataNotifier
                      plainWidget
                      url={`/users/${uid}/shorts`}
                      scrollNodeRef={scrollNodeRef}
                    />
                  )
                }[key]
              }
            </DialogContent>
          </>
        );
      case "user-following":
      case "user-followers":
        return (
          <>
            <DialogContent>
              <FollowMeWidget
                infiniteScrollProps={{
                  scrollNodeRef,
                  componentProps: {
                    plainWidget: true
                  }
                }}
                key={view}
                url={
                  {
                    "user-followers": "followers",
                    "user-following": "following"
                  }[view]
                }
              />
            </DialogContent>
          </>
        );
      case "comments":
        return (
          <>
            <DialogTitle>{goBackElem}</DialogTitle>
            <DialogContent
              sx={{
                p: 0,
                pb: 3
              }}
            >
              <Comments
                documentId={cid}
                key={cid}
                scrollNodeRef={scrollNodeRef}
              />
            </DialogContent>
          </>
        );
      case "user-blacklist":
        return (
          <>
            <DialogTitle component={Stack}>
              <Typography color="primary" variant="h5">
                {context.dataSize || 0} blacklisted user(s)
              </Typography>
              {context.processing ? (
                <LoadingDot sx={{ float: "right", py: "4px" }} />
              ) : (
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    setContext(context => ({
                      ...context,
                      action: "whitelist-all"
                    }));
                  }}
                  sx={{ float: "right" }}
                >
                  whitelist all
                </Button>
              )}
            </DialogTitle>
            <DialogContent>
              <UserBlacklistView
                whitelistAll={context.action === "whitelist-all"}
                key="view-blacklist"
                scrollNodeRef={scrollNodeRef}
                handleAction={_handleAction}
              />
            </DialogContent>
          </>
        );
      case "session-timeout":
        return (
          <>
            <DialogTitle>Session timeout</DialogTitle>
            <DialogContent
              sx={{
                px: 0
              }}
            >
              <SessionTimeout />
            </DialogContent>
          </>
        );
      default:
        return null;
    }
  };

  if (
    (compose === "comment" && !state) ||
    (compose === "comments" && !cid) ||
    (view === "user-blacklist" && !isCurrentUser)
  )
    return <Navigate to={-1} />;

  const paperStyles = {
    sx: {
      minHeight: "10vh",
      width: "100%",
      p: 0,
      maxWidth: view === "user-blacklist" ? "700px" : undefined
    }
  };

  return (
    <>
      <Dialog
        data-dialog-type="view"
        PaperProps={paperStyles}
        open={openFor[view]}
        onClose={closeDialog}
      >
        {renderDialog(view)}
        {view && view !== "session-timeout" ? (
          <DialogActions
            sx={{
              borderTop: "1px solid #333",
              borderColor: "divider",
              display: {
                xs: "flex",
                md: "none"
              }
            }}
          >
            <Button variant="contained" onClick={closeDialog}>
              Close
            </Button>
          </DialogActions>
        ) : null}
      </Dialog>
      <Dialog
        data-dialog-type="compose"
        PaperProps={paperStyles}
        open={openFor[compose]}
        onClose={closeDialog}
      >
        {renderDialog(compose)}
      </Dialog>
    </>
  );
};

ComposeAndView.propTypes = {};

export default ComposeAndView;
