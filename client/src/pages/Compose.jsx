import React, { useState, useRef, useCallback } from "react";
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
import PostsView from "components/PostsView";
import ShortsWidget from "components/ShortsWidget";
import { useLocation, useSearchParams, Navigate } from "react-router-dom";
import { useContext } from "redux/store";
Dialog.defaultProps = {
  open: false
};

const Compose = ({ openFor }) => {
  const { pathname, state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const stateRef = useRef({
    isSubmitting: false
  });
  const { setComposeDoc } = useContext();
  const view = searchParams.get("view");
  const compose = (searchParams.get("compose") || view || "").toLowerCase();
  const closeDialog = useCallback(
    e => {
      e && e.stopPropagation();
      if (stateRef.current.isSubmitting) return;
      stateRef.current.r = false;
      searchParams.delete("compose");
      searchParams.delete("view");
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );

  const _handleAction = useCallback(
    (reason, res) => {
      // console.log(res.threads, state, reason, " compose data ");
      switch (reason) {
        case "failed":
          stateRef.current.isSubmitting = false;
          return;
        case "temp-data":
          stateRef.current.isSubmitting = true;
          console.log(" is submitting ");
          return;
        case "new":
          stateRef.current.isSubmitting = false;
          res.reason = reason;
          if (!res.docType && state) res.docType = state.docType;
          setComposeDoc(res);
          closeDialog();
          break;
        default:
          break;
      }
    },
    [closeDialog, setComposeDoc, state]
  );

  const renderDialog = () => {
    // console.log(compose, "compose");
    if (!compose) return;
    switch (compose) {
      case "create-post":
      case "create-short":
        const sx = {
          backgroundColor: "transparent"
        };
        return (
          <>
            <DialogTitle
              sx={{
                border: "1px solid #333",
                borderColor: "divider"
              }}
              component={Stack}
            >
              <Typography variant="h5" fontWeight="bold">
                Share your moment
              </Typography>
              <IconButton onClick={closeDialog}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {{
                "create-short": (
                  <InputBox
                    autoFocus
                    showIndicator={false}
                    showActionBar={false}
                    multiple={false}
                    accept="video"
                    url="/shorts/new"
                    mediaRefName="short"
                    max={40}
                    sx={sx}
                    videoPlayerProps={{
                      withIntersection: false
                    }}
                    required={{
                      short: "You need to select a video!"
                    }}
                    handleAction={_handleAction}
                  />
                )
              }[compose] || (
                <InputBox
                  autoFocus
                  handleAction={_handleAction}
                  videoPlayerProps={{
                    withIntersection: false
                  }}
                  sx={sx}
                />
              )}
            </DialogContent>
          </>
        );
      case "comment":
        return (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <IconButton onClick={closeDialog}>
                <CloseIcon />
              </IconButton>
              <Typography color="primary.dark">{304} views</Typography>
            </DialogTitle>
            <DialogContent>
              <PostWidget
                sx={{
                  backgroundColor: "transparent"
                }}
                post={state.post}
                readOnly
              />
              <InputBox
                resetData
                method="post"
                accept=".jpg,.jpeg,.png,.gif"
                autoFocus
                url={`/comments/new/${state.docType || "post"}`}
                placeholder="Send your opinion"
                actionText="Reply"
                mediaRefName="media"
                multiple={false}
                message={{
                  success: `Added comment successfully`
                }}
                placeholders={{
                  document: state.post.id,
                  visibility: state.post.visibility
                }}
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
            <DialogContent>
              {
                {
                  "user-posts": (
                    <PostsView
                      plainWidget
                      hideDataNotifier
                      url="/users/posts"
                      postSx={{
                        border: "1px solid #fff",
                        borderColor: "divider",
                        borderRadius: 2
                      }}
                    />
                  ),
                  "user-shorts": (
                    <ShortsWidget
                      hideDataNotifier
                      plainWidget
                      url="/users/shorts"
                    />
                  )
                }[compose]
              }
            </DialogContent>
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
                Cancel
              </Button>
            </DialogActions>
          </>
        );
      default:
        return null;
    }
  };

  // if (!state && !stateRef.r && compose) {
  //   stateRef.r = true;
  //   return (
  //     <Navigate
  //       to={`?compose=${{ "/": "post", shorts: "short" }[pathname] ||
  //         compose ||
  //         openFor}`}
  //     />
  //   );
  // }
  return (
    <>
      <Dialog
        PaperProps={{
          sx: view && {
            minHeight: "30vh",
            width: "100%"
          }
        }}
        open={openFor[compose]}
        onClose={closeDialog}
      >
        {renderDialog()}
      </Dialog>
    </>
  );
};

Compose.propTypes = {};

export default Compose;
