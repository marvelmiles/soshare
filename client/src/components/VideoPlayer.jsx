import React, { useRef } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import mp4 from "./video.mp4";
const VideoPlayer = ({
  autoPlayOnMouseOver = true,
  hideTimeline,
  hideControls,
  onClick
}) => {
  const videoRef = useRef();
  const stateRef = useRef({}).current;
  const togglePlay = () => {
    videoRef.current.paused
      ? videoRef.current.play()
      : videoRef.current.pause();
  };
  const onMouseHover = () => {
    if (!stateRef.hasMouseHovered) {
      console.log("moseus ovr timer...");
      stateRef.moueHoverTimer = setTimeout(() => {
        // mimic user-interaction enables autoplay
        videoRef.current.muted = true;
        togglePlay();
      }, 3000);
    }
    stateRef.hasMouseHovered = true;
  };
  const onMouseLeave = () => {
    console.log("leaved..");
    if (stateRef.moueHoverTimer) {
      console.log(" cleared timer...");
      clearTimeout(stateRef.moueHoverTimer);
      !videoRef.current.paused && togglePlay();
      stateRef.moueHoverTimer = null;
    }
    stateRef.hasMouseHovered = false;
  };
  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "inherit",
        "& > video": {
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
          objectFit: "cover"
        }
      }}
      onClick={onClick}
    >
      <video
        src={mp4}
        ref={videoRef}
        controls={false}
        onMouseOver={onMouseHover}
        onMouseLeave={onMouseLeave}
      />
      <div
        style={{
          display: hideTimeline && hideControls ? "none" : "block"
        }}
      >
        <div id="timeline"></div>
        <div id="controls"></div>
      </div>
    </Box>
  );
};

VideoPlayer.propTypes = {};

export default VideoPlayer;
