import React, { useRef, useCallback, useState, useEffect } from "react";
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
import { useSearchParams, useNavigate } from "react-router-dom";
import { useContext } from "context/store";
import FollowMeWidget from "components/FollowMeWidget";
import Comments from "components/Comments";
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
  const [searchParams] = useSearchParams();
  const stateRef = useRef({
    commentHolder: {},
    dType: ""
  });
  const [ctx, setCtx] = useState({});
  const { setContext, locState, prevPath = "" } = useContext();
  const cid = searchParams.get("cid") || "";
  const scrollNodeRef = useRef();
  const navigate = useNavigate();

  let view = (searchParams.get("view") || "").toLowerCase();
  let compose = (searchParams.get("compose") || "").toLowerCase();

  const closeDialog = useCallback(
    (e, dialogType, done) => {
      e && e.stopPropagation();
      stateRef.current.commentHolder = {};
      stateRef.current.dType = "";
      if (stateRef.current.path) handleCancelRequest(stateRef.current.path);
      setCtx({});
      dialogType = e ? e.currentTarget.dataset.dialogType : dialogType;
      const prop =
        done || !locState?.outInputs
          ? { state: null }
          : {
              state: locState
            };
      if (prevPath) navigate(-1, prop);
      else navigate(window.location.pathname, prop);
    },
    [navigate, prevPath, locState]
  );

  const _handleAction = useCallback(
    (reason, res, info) => {
      const appendDoc = () => {
        stateRef.current.path = undefined;
        res.reason = reason;
        if (!res.docType && locState) res.docType = locState.docType;
        setContext(context => {
          context.composeDoc = res;
          return { ...context };
        });
        closeDialog(undefined, "compose", true);
      };
      switch (reason) {
        case "error":
          stateRef.current.path = undefined;
          return;
        case "temp-data":
          stateRef.current.path = info;
          return;
        case "new":
          appendDoc();
          break;
        case "update":
          if (compose === "comment") appendDoc();
          break;
        case "context":
          setCtx(context => ({
            ...context,
            ...res
          }));
          break;
        default:
          break;
      }
    },
    [closeDialog, setContext, locState, compose]
  );

  useEffect(() => {
    if (stateRef.current.dType) closeDialog(undefined, stateRef.current.dType);
  }, [closeDialog]);

  const renderDialog = key => {
    switch (key) {
      case "create-post":
      case "create-short":
        const fileId = `${key}-file-picker`;
        return (
          <>
            <DialogTitle component={Stack}>
              <Stack>
                {ctx.processing ? (
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
            <DialogContent ref={scrollNodeRef}>
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
        if (stateRef.current.commentHolder.document !== locState.document.id) {
          stateRef.current.commentHolder = {
            document: locState.document.id,
            ...(locState.outInputs
              ? locState.outInputs[locState.document.id]
              : undefined)
          };
        }

        return (
          <>
            <DialogContent sx={{ p: 0 }} ref={scrollNodeRef}>
              <PostWidget post={locState.document} enableSnippet />
              <InputBox
                inputClassName="fff"
                withPlaceholders={false}
                submitInputsOnly={false}
                resetData={false}
                method="post"
                accept=".jpg,.jpeg,.png,.gif"
                url={`/comments/new/${locState.docType || "post"}?ro=${
                  locState.document.user.id
                }`}
                placeholder="Send your opinion"
                mediaRefName="media"
                multiple={false}
                message={{
                  success: `Your comment has been soshared!`
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
              ref={scrollNodeRef}
            >
              {
                {
                  "user-posts": (
                    <PostsView
                      privateUid={uid}
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
                      privateUid={uid}
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
            <DialogContent ref={scrollNodeRef}>
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
                priority={
                  {
                    "user-followers": "toggle",
                    "user-following": "unfollow"
                  }[view]
                }
                privateUid={uid}
              />
            </DialogContent>
          </>
        );
      case "comments":
        return (
          <>
            <DialogContent
              sx={{
                p: 0,
                pb: 3
              }}
              ref={scrollNodeRef}
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
                {ctx.dataSize || 0} blacklisted user(s)
              </Typography>
              {ctx.processing ? (
                <LoadingDot sx={{ float: "right", py: "4px" }} />
              ) : (
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    setCtx(context => ({
                      ...context,
                      action: "whitelist-all"
                    }));
                  }}
                  sx={{ float: "right" }}
                  disabled={!ctx.dataSize}
                >
                  whitelist all
                </Button>
              )}
            </DialogTitle>
            <DialogContent ref={scrollNodeRef}>
              <UserBlacklistView
                whitelistAll={ctx.action === "whitelist-all"}
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
    (compose === "comment" && !locState) ||
    (compose === "comments" && !cid)
  ) {
    stateRef.current.dType = "compose";
    compose = "";
  }

  if (view === "user-blacklist" && !isCurrentUser) {
    stateRef.current.dType = "view";
    view = "";
  }

  const paperStyles = {
    sx: {
      minHeight: "10vh",
      width: "100%",
      p: 0,
      maxWidth: view === "user-blacklist" ? "700px" : undefined
    }
  };
  const isSession = view === "session-timeout";
  return (
    <>
      <Dialog
        data-dialog-type="view"
        PaperProps={paperStyles}
        open={openFor[view]}
        onClose={isSession ? undefined : closeDialog}
        sx={{
          zIndex: isSession ? "tooltip" : "modal"
        }}
      >
        {renderDialog(view)}
        {view && !isSession ? (
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
