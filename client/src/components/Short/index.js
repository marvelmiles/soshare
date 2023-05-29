import React, { useState, useCallback, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import VideoPlayer from "components/VideoPlayer";
import { useSelector } from "react-redux";
import http from "api/http";
import ShortFooter from "./ShortFooter";
import ShortSidebar from "./ShortSidebar";
import { useNavigate } from "react-router-dom";
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
      loop
    },
    ref
  ) => {
    const { setComposeDoc, composeDoc } = useContext();
    const cid = useSelector(state => (state.user.currentUser || {}).id);
    const navigate = useNavigate();
    const stateRef = useRef({
      backdropText: "Unable to play video"
    });
    const [loading, setLoading] = useState(true);
    const onTimeUpdate = useCallback(async () => {
      try {
        if (miniShort || short.views[cid]) return;
        handleAction("update", {
          id: short.id,
          views: await http.patch(`/shorts/${short.id}/view`)
        });
      } catch (msg) {}
    }, [short.id, short.views, cid, handleAction, miniShort]);

    const onLoadedMetadata = useCallback(() => setLoading(false), []);
    const onClick = useCallback(
      e => {
        e.stopPropagation();
        console.log(" clicked... ", short.id);
        miniShort &&
          setComposeDoc({
            id: short.id,
            docType: "short",
            reason: "fetch"
          });

        window.location.pathname.toLowerCase() !== "/shorts" &&
          navigate(`/shorts`);
      },
      [navigate, setComposeDoc, short.id, miniShort]
    );
    const onError = useCallback(
      ({ severity, withReload }) => {
        if (!withReload) setLoading(false);
        if (severity === 1) handleAction("filter", short.id, undefined, false);
      },
      [handleAction, short.id]
    );
    const onReload = useCallback(() => setLoading(true), []);
    return (
      <Box
        id={short.id}
        key={short.id + miniShort + "short"}
        ref={ref}
        sx={{
          position: "relative",
          borderRadius: 3,
          width: miniShort
            ? {
                xs: "100%",
                md: "110px"
              }
            : "100%",
          height: miniShort ? "200px" : "80vh",
          mb: 1,
          border: "1px solid currentColor",
          borderColor: "divider"
        }}
      >
        <VideoPlayer
          id={short.id}
          key={short.id + miniShort + "short"}
          loop={loop}
          src={short.url}
          mimetype={short.mimetype}
          hideControls
          enableIndicator={!miniShort}
          backdrops={{
            RELOAD: true
          }}
          pause={short.pause}
          autoPlay={!miniShort}
          withIntersection={!miniShort}
          hoverPlayDelay={miniShort && 500}
          hideTimeline={miniShort}
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
          handleAction={handleAction}
          loading={loading}
          animation={stateRef.current.backdropText ? false : undefined}
        />
      </Box>
    );
  }
);

Short.propTypes = {};

export default Short;
