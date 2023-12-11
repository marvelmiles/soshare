import React, { useRef, useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import SosharePen from "./SosharePen";
import IconButton from "@mui/material/IconButton";
import PostWidget from "components/PostWidget";
import { StyledTypography } from "components/styled";
import Stack from "@mui/material/Stack";
import PostsView from "views/PostsView";
import ShortsView from "views/ShortsView";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useContext } from "context/store";
import FollowMeView from "views/FollowMeView";
import Comments from "components/Comments";
import { LoadingDot } from "components/Loading";
import UserBlacklistView from "views/UserBlacklistView";
import { handleCancelRequest } from "api/http";
import SessionTimeout from "./SessionTimeout";
import Box from "@mui/material/Box";
import Loading from "components/Loading";

Dialog.defaultProps = {
  open: false
};

const ComposeAndView = ({ openFor, isCurrentUser, uid, close, keepTab }) => {
  isCurrentUser = isCurrentUser === undefined ? !!uid : isCurrentUser;

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

  const { setContext, locState } = useContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const stateRef = useRef({
    locState,
    commentHolder: {},
    dType: "",
    compose: "",
    view: ""
  });

  const [ctx, setCtx] = useState({
    dataSize: 0,
    processing: false,
    disable: true
  });

  const cid = searchParams.get("cid") || "";

  const vuid = searchParams.get("vuid") || "";

  uid = vuid || uid;

  const scrollNodeRef = useRef();

  const navigate = useNavigate();

  const portalNodeRef = useRef();

  const view =
    (searchParams.get("view") || "").toLowerCase() || stateRef.current.view;
  const compose =
    (searchParams.get("compose") || "").toLowerCase() ||
    stateRef.current.compose;

  stateRef.current.locState = locState;

  const resetState = () => {
    const stateCtx = stateRef.current;

    stateCtx.compose = undefined;
    stateCtx.view = undefined;
    clearTimeout(stateCtx.taskId);
    stateCtx.taskId = undefined;
  };

  const closeDialog = useCallback(
    (e, dialogType) => {
      e && e.stopPropagation();

      const stateCtx = stateRef.current;

      stateCtx.commentHolder = {};
      stateCtx.dType = "";

      if (stateRef.current.path) handleCancelRequest(stateRef.current.path);

      setCtx({});

      const dataset = e ? (e.currentTarget || e.node).dataset : {};

      dialogType = dataset.dialogType || dialogType;

      for (const key of (
        dialogType +
        ` ${keepTab ? "" : "tab"} bTab wc search ${
          dialogType === "view" ? "cid vuid" : ""
        }`
      ).split(" ")) {
        searchParams.delete(key);
      }

      setSearchParams(searchParams, {
        state: stateCtx.locState,
        replace: true
      });

      stateCtx.taskId = setTimeout(resetState, 0);
    },
    [searchParams, setSearchParams, keepTab]
  );

  const _handleAction = useCallback(
    (reason, res, info) => {
      const appendDoc = () => {
        const { locState } = stateRef.current;
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
        case "data":
          setCtx(context => ({
            ...context,
            dataSize: res.dataSize,
            disable: res.loading || !res.dataSize
          }));
          break;
        case "tabChanged":
          if (res.isBefore) {
            setCtx({ disable: true, dataSize: 0 });
          } else
            setCtx(ctx => ({
              ...ctx,
              dataSize: res.dataSize,
              disable: res.loading || !res.dataSize
            }));

          break;
        default:
          break;
      }
    },
    [closeDialog, setContext, compose]
  );

  useEffect(() => {
    const stateCtx = stateRef.current;

    if (close) stateCtx.dType = "view compose";

    if (stateCtx.dType) closeDialog(undefined, stateCtx.dType);

    return () => {
      resetState();
    };
  }, [closeDialog, close]);

  const renderDialog = key => {
    const soSharePenSx = {
      minHeight: 0,
      paddingTop: "16px",
      ".input-box-actions": {
        borderBottom: 0
      }
    };

    const viewProps = {
      randomize: false
    };

    switch (key) {
      case "create-post":
      case "create-short":
        const fileId = `${key}-file-picker`;

        return (
          <>
            <DialogTitle
              component={Stack}
              flexWrap={{
                xs: "wrap-reverse",
                sm: "nowrap"
              }}
              alignItems="flex-start"
            >
              <Stack
                flexWrap="wrap"
                sx={{ width: "100%" }}
                alignItems="flex-start"
              >
                {ctx.processing ? (
                  <StyledTypography variant="h5" fontWeight="bold">
                    <LoadingDot />
                  </StyledTypography>
                ) : (
                  <div>
                    <StyledTypography
                      variant="caption"
                      sx={{
                        color: "error.main"
                      }}
                    >
                      Media limit (
                      {compose === "create-short" ? "500mb / 60s" : "1gb / 5h"})
                    </StyledTypography>
                    <StyledTypography
                      variant="h5"
                      sx={{ mt: "0px" }}
                      fontWeight="bold"
                      mb={0}
                    >
                      Share your moment
                    </StyledTypography>
                    {key === "create-short" ? (
                      <StyledTypography
                        htmlFor={fileId}
                        component="label"
                        variant="caption"
                        sx={{
                          color: "error.main"
                        }}
                      >
                        Select a video!
                      </StyledTypography>
                    ) : null}
                  </div>
                )}
              </Stack>
              <Stack
                flexWrap={{
                  xs: "wrap-reverse",
                  s200: "nowrap"
                }}
                alignItems="flex-start"
                sx={{ width: "100%" }}
                justifyContent={{
                  xs: "space-between",
                  sm: "flex-end"
                }}
              >
                <div>
                  {/* <StyledTypography onClick={handlePreview} variant="link">
                    Preview
                  </StyledTypography> */}
                  <StyledTypography sx={{ mt: "0px" }}>
                    Preffered Dimensions:
                  </StyledTypography>
                  <StyledTypography sx={{ mt: "0px" }}>
                    width x height: 320 x 564
                  </StyledTypography>
                </div>
                <IconButton
                  sx={{
                    backgroundColor: "action.selected"
                  }}
                  data-dialog-type="compose"
                  onClick={closeDialog}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent ref={scrollNodeRef}>
              {{
                "create-short": (
                  <SosharePen
                    key={fileId}
                    fileId={fileId}
                    showIndicator={false}
                    showActionBar={false}
                    multiple={false}
                    accept="video"
                    url="/shorts/new"
                    mediaRefName="short"
                    max={40}
                    docType="short"
                    videoPlayerProps={{
                      withIntersection: false
                    }}
                    required={{
                      short: "You need to select a video!"
                    }}
                    handleAction={_handleAction}
                    placeholder="#ShortTags"
                    maxUpload="500mb"
                    maxDuration="60s"
                    sx={soSharePenSx}
                  />
                )
              }[key] || (
                <SosharePen
                  key={fileId}
                  docType="post"
                  handleAction={_handleAction}
                  videoPlayerProps={{
                    withIntersection: false
                  }}
                  handleAction={_handleAction}
                  sx={soSharePenSx}
                />
              )}
            </DialogContent>
          </>
        );
      case "comment":
        if (
          locState.document &&
          stateRef.current.commentHolder.document !== locState.document.id
        ) {
          stateRef.current.commentHolder = {
            document: locState.document.id,
            ...(locState.docSet
              ? locState.docSet[locState.document.id]
              : undefined)
          };
        }

        return (
          <>
            <DialogContent sx={{ p: 0 }} ref={scrollNodeRef}>
              <PostWidget post={locState.document} enableSnippet />
              <SosharePen
                withPlaceholders={false}
                submitInputsOnly={false}
                resetData={false}
                method="post"
                accept=".jpg,.jpeg,.png,.gif"
                url={`/comments/new/${locState.docType || "post"}?ro=${
                  locState.document?.user?.id
                }`}
                placeholder="Send your opinion"
                mediaRefName="media"
                multiple={false}
                message={{
                  success: "Your comment has been soshared!"
                }}
                placeholders={stateRef.current.commentHolder}
                max={280}
                sx={soSharePenSx}
                handleAction={_handleAction}
                sx={soSharePenSx}
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
                      key={uid}
                      infiniteScrollProps={viewProps}
                      privateUid={uid}
                      plainWidget
                      url={`/users/${uid}/posts`}
                      sx={{
                        p: 0
                      }}
                      scrollNodeRef={scrollNodeRef}
                    />
                  ),
                  "user-shorts": (
                    <ShortsView
                      key={uid}
                      infiniteScrollProps={viewProps}
                      privateUid={uid}
                      hideDataNotifier
                      componentProps={{ plainWidget: true }}
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
              <FollowMeView
                widgetProps={{ plainWidget: true }}
                infiniteScrollProps={{
                  scrollNodeRef,
                  verify: "t",
                  key: view,
                  ...viewProps
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
            {/* <DialogTitle>
              <IconButton
                data-dialog-close="strict"
                data-dialog-type="view"
                onClick={closeDialog}
                sx={{ float: "right" }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle> */}
            <DialogContent
              sx={{
                p: 0
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
        stateRef.current.paramKey = "tab";

        return (
          <>
            <DialogTitle component={Stack}>
              <Stack>
                <StyledTypography
                  minWidth="100%"
                  textEllipsis
                  maxWidth="180px"
                  variant="h6"
                >
                  {ctx.dataSize} user
                  {ctx.dataSize > 1 ? "s" : ""}
                </StyledTypography>
                {ctx.processing && <LoadingDot />}
              </Stack>
              <Box
                className="dialog-title-portal"
                sx={{
                  flex: 1,
                  ".custom-input": {
                    display: "block"
                  }
                }}
                ref={portalNodeRef}
              ></Box>
              {!ctx.processing && (
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    setCtx(context => ({
                      ...context,
                      action: "whitelist-all"
                    }));
                  }}
                  disabled={ctx.disable}
                >
                  whitelist all
                </Button>
              )}
            </DialogTitle>
            <DialogContent ref={scrollNodeRef} sx={{ py: 0 }}>
              <UserBlacklistView
                whitelistAll={ctx.action === "whitelist-all"}
                key="view-blacklist"
                scrollNodeRef={scrollNodeRef}
                searchInputPortalRef={portalNodeRef}
                handleAction={_handleAction}
                infiniteScrollProps={viewProps}
              />
            </DialogContent>
            <Box
              className="dialog-loading"
              sx={{
                position: "absolute",
                backgroundColor: "inherit",
                width: "100%",
                height: "100%",
                zIndex: 1,
                borderRadius: "inherit"
              }}
            >
              <Loading />
            </Box>
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
    (compose === "comment" && !locState.document?.id) ||
    (compose === "comments" && !cid)
  )
    stateRef.current.dType = "compose";

  if (view === "user-blacklist" && !isCurrentUser)
    stateRef.current.dType = "view";

  const paperStyles = {
    sx: {
      minHeight: "10vh",
      width: "100%",
      p: 0,
      maxWidth: view === "user-blacklist" ? "700px" : undefined,
      overflow: "hidden"
    }
  };
  const isSession = view === "session-timeout";

  return (
    <>
      {view ? (
        <Dialog
          data-dialog-type="view"
          PaperProps={paperStyles}
          open={stateRef.current.view ? false : openFor[view]}
          key={0}
          onClose={isSession ? undefined : closeDialog}
          sx={{
            zIndex: isSession ? "tooltip" : "modal",
            ".MuiDialogTitle-root:has(.dialog-title-portal:not(:empty)) ~ div.dialog-loading": {
              display: "none"
            }
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
              <Button
                data-dialog-type="view"
                variant="contained"
                onClick={closeDialog}
              >
                Close
              </Button>
            </DialogActions>
          ) : null}
        </Dialog>
      ) : null}
      <Dialog
        data-dialog-type="compose"
        PaperProps={paperStyles}
        open={openFor[compose]}
        onClose={ctx.processing ? undefined : closeDialog}
        key={1}
        sx={{
          ".MuiDialogContent-root": {
            p: 0
          }
        }}
      >
        {renderDialog(compose || stateRef.current.view)}
      </Dialog>
    </>
  );
};

ComposeAndView.propTypes = {};

export default ComposeAndView;
