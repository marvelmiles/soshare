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
import mp4 from "components/resized.mp4";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

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
      stateCtx,
      mx
    },
    ref
  ) => {
    const cid = useSelector(state => (state.user.currentUser || {}).id);
    const navigate = useNavigate();
    const { setContext } = useContext();
    const stateRef = useRef({
      backdropText: "",
      backdrops: {
        RELOAD: true
      }
    });
    const contRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [showVolume, setShowVolume] = useState(!miniShort);
    const [muted, setMuted] = useState(miniShort);
    const [hasAudio, setHasAudio] = useState(false);

    const onTimeUpdate = useCallback(async () => {
      try {
        if (miniShort || short.views[cid]) return;
        handleAction("update", {
          id: short.id,
          views: await http.patch(`/shorts/${short.id}/view`)
        });
      } catch (msg) {}
    }, [short.id, short.views, cid, handleAction, miniShort]);

    const onPlay = useCallback((v, { mouseEnter, hasAudio }) => {
      setHasAudio(hasAudio);
      setShowVolume(true);
      setMuted(false);
    }, []);

    const onPause = useCallback(
      (v, { e }) => {
        setMuted(true);
        if (e && e.relatedTarget.nodeName !== "BUTTON") {
          setShowVolume(!miniShort);
        }
      },
      [miniShort]
    );

    const onReady = useCallback(() => setLoading(false), []);

    const onClick = useCallback(
      e => {
        e.stopPropagation();
        window.location.pathname.toLowerCase() !== "/shorts" &&
          navigate(`/shorts`, {
            state: { shortId: miniShort ? short.id : undefined }
          });
      },
      [navigate, short.id, miniShort]
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

    const maxHeight = "calc(100vh - 65px)";

    return (
      <Box
        key={short.id + miniShort + "short"}
        sx={{
          position: "relative",
          border: "1px solid currentColor",
          borderColor: "divider",
          ...(miniShort
            ? {
                width: {
                  xs: "100%",
                  lg: "48%"
                },
                borderRadius: "8px",
                height: "190px",
                maxWidth: "150px",
                minHeight: "200px",
                ".custom-overlay": {
                  cursor: "pointer"
                },
                mx
              }
            : {
                mx: "auto",
                width: {
                  xs: "100%",
                  md: "360px"
                },
                borderRadius: {
                  xs: "0px",
                  md: "12px"
                },
                height: "100vh",
                maxHeight,
                minHeight: maxHeight
              })
        }}
        ref={node => {
          ref && (ref.current = node);
          contRef.current = node || null;
        }}
      >
        <VideoPlayer
          contRef={contRef || null}
          withKeyEvents={!miniShort}
          hideControls
          id={short.id}
          muted={muted}
          loop={loop}
          src={short.url}
          mimetype={short.mimetype}
          enableIndicator={!miniShort}
          backdrops={stateRef.current.backdrops}
          pause={short.pause}
          withIntersection={miniShort ? undefined : true}
          hoverPlayDelay={miniShort && 500}
          hideTimeline={miniShort}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          onClick={onClick}
          onReady={onReady}
          onReload={onReload}
          onError={onError}
          sx={{
            position: undefined,
            border: "none",
            ...(miniShort
              ? {
                  cursor: loading ? "default" : "pointer",
                  minHeight: "0px"
                }
              : {
                  height: "inherit",
                  minHeight: "inherit"
                }),
            "& .video-player-footer": !miniShort && {
              background: "none",
              py: 0,
              bottom: "0px",
              ".MuiSlider-thumb": {
                opacity: 0,
                pointerEvents: "none",
                transition: "opacity 0.5s"
              },
              "&:hover .MuiSlider-thumb": {
                opacity: 1,
                pointerEvents: "all",
                transition: "opacity 0.5s"
              },
              ".video-player-footer-main-box": {
                py: 0
              }
            },
            "& .custom-media": {
              borderRadius: "inherit"
            }
          }}
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
          hasAudio={hasAudio}
          muted={muted}
          withVolume={showVolume}
          handleAction={_handleAction}
          loading={loading}
          animation={stateRef.current.backdropText ? false : undefined}
        />
      </Box>
    );
  }
);

Short.propTypes = {};

export default Short;
