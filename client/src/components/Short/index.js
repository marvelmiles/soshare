import React, { useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import VideoPlayer from "components/VideoPlayer";
import { useSelector } from "react-redux";
import http from "api/http";
import ShortFooter from "./ShortFooter";
import ShortSidebar from "./ShortSidebar";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { useContext } from "context/store";
const Short = React.forwardRef(
  (
    {
      short = {
        likes: {},
        user: {},
        views: {}
      },
      miniShort,
      handleAction,
      loop,
      dialogContent,
      stateCtx,
      ...rest
    },
    ref
  ) => {
    const cid = useSelector(state => (state.user.currentUser || {}).id);
    const navigate = useNavigate();
    const { setContext } = useContext();
    const stateRef = useRef({
      backdropText: "Unable to play video"
    });
    const [loading, setLoading] = useState(true);
    const [showVolume, setShowVolume] = useState(!miniShort);
    const [muted, setMuted] = useState(miniShort);

    const onTimeUpdate = useCallback(async () => {
      try {
        if (miniShort || short.views[cid]) return;
        handleAction("update", {
          id: short.id,
          views: await http.patch(`/shorts/${short.id}/view`)
        });
      } catch (msg) {}
    }, [short.id, short.views, cid, handleAction, miniShort]);

    const onPlay = useCallback(
      (v, { mouseEnter }) => {
        setShowVolume(true);
        if (stateCtx.shouldUnmute) setMuted(mouseEnter ? v.muted : false);
        stateCtx.shouldUnmute = true;
      },
      [stateCtx]
    );

    const onPause = useCallback(
      (v, { e }) => {
        if (e && e.relatedTarget.nodeName !== "BUTTON") {
          setShowVolume(!miniShort);
          setMuted(true);
        }
      },
      [miniShort]
    );

    const onLoadedMetadata = useCallback(() => setLoading(false), []);

    const onClick = useCallback(
      e => {
        e.stopPropagation();
        window.location.pathname.toLowerCase() !== "/shorts" &&
          navigate(`/shorts`);
        setContext(prev => ({
          ...prev,
          composeDoc: {
            docType: "short",
            reason: "search",
            document: {
              id: short.id
            }
          }
        }));
      },
      [navigate, short.id, setContext]
    );
    const onError = useCallback(
      err => {
        if (!err.withReload) setLoading(false);
        if (err.severity === 1)
          handleAction("filter", short.id, undefined, false);

        if (err.name?.toLowerCase() === "notallowederror") {
          stateCtx.shouldUnmute = false;
          setMuted(true);
        }
      },
      [handleAction, short.id, stateCtx]
    );
    const onReload = useCallback(() => setLoading(true), []);

    const _handleAction = useCallback(
      (reason, res) => {
        switch (reason) {
          case "toggle-mute":
            setMuted(!res.value);
            break;
          default:
            handleAction(reason, res);
            break;
        }
      },
      [handleAction]
    );

    const inheritSx = {
      height: "inherit",
      width: "inherit",
      border: "inherit",
      borderRadius: "inherit",
      color: "inherit"
    };
    return (
      <Box
        sx={{
          position: "relative",
          height: miniShort ? "200px" : "calc(100vh - 80px)",
          borderRadius: miniShort
            ? 3
            : {
                md: 3
              },
          width: miniShort
            ? {
                xs: "100%",
                md: "110px"
              }
            : {
                xs: "100%",
                md: "350px"
              },
          mb: miniShort ? 1 : 0,
          mx: miniShort ? "" : "auto"
        }}
      >
        {dialogContent ? (
          <Typography
            component="div"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              backgroundColor: "background.paper",
              zIndex: 1,
              ...inheritSx
            }}
          >
            {dialogContent}
          </Typography>
        ) : null}
        <Box
          id={short.id}
          key={short.id + miniShort + "short"}
          ref={ref}
          sx={inheritSx}
          {...rest}
        >
          <VideoPlayer
            id={short.id}
            key={short.id + miniShort + "short"}
            muted={muted}
            loop={loop}
            src={short.url}
            mimetype={short.mimetype}
            hideControls
            enableIndicator={!miniShort}
            backdrops={{
              RELOAD: true
            }}
            pause={short.pause}
            withIntersection={miniShort ? undefined : true}
            hoverPlayDelay={miniShort && 500}
            hideTimeline={miniShort}
            onPlay={onPlay}
            onPause={onPause}
            onTimeUpdate={onTimeUpdate}
            onClick={onClick}
            onLoadedMetadata={onLoadedMetadata}
            onReload={onReload}
            onError={onError}
            sx={
              miniShort
                ? {
                    cursor: "pointer"
                  }
                : undefined
            }
            footerSx={
              !miniShort && {
                background: "none",
                py: 0,
                bottom: "-5.5px"
              }
            }
          />

          <ShortFooter
            user={short.user}
            text={short.text}
            views={short.views ? Object.keys(short.views).length : 0}
            miniShort={miniShort}
            id={short.id}
            handleAction={handleAction}
            loading={loading}
            animation={stateRef.current.backdropText ? false : undefined}
          />
          <ShortSidebar
            id={short.id}
            user={short.user}
            muted={muted}
            withVolume={showVolume}
            handleAction={_handleAction}
            loading={loading}
            animation={stateRef.current.backdropText ? false : undefined}
          />
        </Box>
      </Box>
    );
  }
);

Short.propTypes = {};

export default Short;
