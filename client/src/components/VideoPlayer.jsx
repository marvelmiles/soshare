import React, { useRef, useEffect, useCallback, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import mp4 from "./video.mp4";
import useViewIntersection from "hooks/useViewIntersection";
import { Slider } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import PauseIcon from "@mui/icons-material/Pause";
import PlayIcon from "@mui/icons-material/PlayArrow";
import { keyframes } from "@mui/system";
const VideoPlayer = ({
  src,
  autoPlayOnMouseOver = true,
  hideTimeline,
  hideControls,
  onClick,
  autoPlay,
  withIntersection,
  onPlay,
  onPause,
  onTimeUpdate,
  onError,
  styles = {},
  hoverPlayDuration = 30000,
  timeUpdateDuration = 30000,
  hoverPlayDelay = 0,
  disableClick,
  playingThreshold = 0.4,
  pause,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(undefined);
  const [values, setValues] = useState({ seek: 0 });
  const videoRef = useRef();
  const stateRef = useRef({}).current;
  const { isIntersecting } = useViewIntersection(videoRef);

  const handlePlay = useCallback(
    ({ enableIndicator = false, emitFn = true, delay = 0 }) => {
      console.log("playing...");
      if (!videoRef.current) return;
      console.log(videoRef.current.loaded);
      if (videoRef.current.paused) {
        videoRef.current.muted = true;
        videoRef.current.pause();
        setTimeout(() => {
          videoRef.current
            .play()
            .then(() => {
              enableIndicator && setIsPlaying(true);
              onPlay && emitFn && onPlay();
            })
            .catch(err => onError && onError(err));
        }, delay);
      }
    },
    [onPlay, onError]
  );
  const handlePause = useCallback(
    enablePlayingIndicator => {
      if (!videoRef.current) return;
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        console.log("paused..");
        enablePlayingIndicator && setIsPlaying(false);
        onPause && onPause();
      }
    },
    [onPause]
  );
  const handleClick = e => {
    console.log("clicked..", disableClick, withIntersection);
    e.stopPropagation();
    if (disableClick) return;
    if ((withIntersection && isIntersecting) || withIntersection === false) {
      const playProp = {
        enableIndicator: true,
        emitFn: !stateRef.userClicked
      };
      if (videoRef.current.paused) {
        handlePlay(playProp);
      } else {
        handlePause(playProp);
      }
      stateRef.userClicked = true;
    }
    onClick && onClick();
  };

  useEffect(() => {
    const video = videoRef.current;
    const onTimeupdate = () => {
      const dur = video.duration;
      let dur_min = Math.floor(dur / 60);
      let dur_sec = Math.floor(dur % 60);
      const cTime = video.currentTime;
      let cTime_min = Math.floor(cTime / 60);
      let cTime_sec = Math.floor(cTime % 60);
      const durMiliTime = Math.floor(dur * 1000);
      const cMiliTime = Math.floor(cTime * 1000);
      if (pause) video.pause();
      const durationReached = (duration, threshold = playingThreshold) => {
        let maxDur = duration;
        if (dur_min < 1) maxDur = threshold * durMiliTime;
        return cMiliTime >= maxDur;
      };
      if (
        hoverPlayDelay &&
        stateRef.hoverPlaying &&
        durationReached(hoverPlayDuration)
      )
        video.currentTime = 0;

      if (onTimeUpdate) {
        if (timeUpdateDuration) {
          if (!stateRef.timeReached && durationReached(timeUpdateDuration)) {
            stateRef.timeReached = true;
            onTimeUpdate();
          }
        } else onTimeUpdate();
      }
      const prop = {
        duration: {
          min: dur_min,
          sec: dur_sec
        },
        cTime: {
          min: cTime_min,
          sec: cTime_sec
        },
        seek: Math.floor((cTime / dur) * 100)
      };

      setValues(prop);
    };
    let onMouseEnter, onMouseLeave;
    if (hoverPlayDelay) {
      const playProp = {
        emitFn: false
      };
      onMouseEnter = () => {
        if (
          !stateRef.hasMouseHovered &&
          !stateRef.userClicked &&
          video.paused
        ) {
          stateRef.moueHoverTimer = setTimeout(() => {
            stateRef.hoverPlaying = true;
            handlePlay(playProp);
          }, hoverPlayDelay);
        }
        stateRef.hasMouseHovered = true;
      };
      onMouseLeave = () => {
        if (stateRef.moueHoverTimer) {
          clearTimeout(stateRef.moueHoverTimer);
          stateRef.moueHoverTimer = null;
          if (!stateRef.userClicked) {
            video.currentTime = 0;
            handlePause(playProp);
          }
        }
        stateRef.hasMouseHovered = false;
      };
      video.addEventListener("mouseenter", onMouseEnter, false);
      video.addEventListener("mouseleave", onMouseLeave, false);
    }
    const onLoadedData = () => {
      console.log("loaded...");
      setLoaded(true);
    };
    video.addEventListener("loadedmetadata", onLoadedData, false);
    video.addEventListener("timeupdate", onTimeupdate, false);
    return () => {
      if (!video.paused) video.pause();
      video.removeEventListener("timeupdate", onTimeupdate, false);
      video.removeEventListener("mouseenter", onMouseEnter, false);
      video.removeEventListener("timeupdate", onMouseLeave, false);
    };
  }, [
    hoverPlayDuration,
    hoverPlayDelay,
    stateRef,
    handlePlay,
    handlePause,
    playingThreshold,
    timeUpdateDuration,
    onTimeUpdate,
    pause
  ]);

  useEffect(() => {
    if (loaded && typeof autoPlay === "boolean") {
      if (withIntersection ? isIntersecting && autoPlay : autoPlay) {
        stateRef.hasMouseHovered = true;
        handlePlay({
          emitFn: true,
          delay: 500
        });
      } else {
        stateRef.userClicked = false;
        handlePause();
      }
    }
  }, [
    loaded,
    autoPlay,
    stateRef,
    withIntersection,
    isIntersecting,
    handlePlay,
    handlePause
  ]);

  const handleGoto = (e, v) => {
    const ctime = (v * videoRef.current.duration) / 100;
    // console.log(ctime, videoRef.current.duration);
    if (ctime >= 0) videoRef.current.currentTime = ctime;
  };

  const zoom = keyframes`
  0% {
    transform: scale(0, 0);
    opcaity:1;
  }
  20% {
    transform: scale(0.2, 0.2);
  }
  20% {
    transform: scale(0.4, 0.4);
  }
  50% {
    transform: scale(0.5, 0.5);
    opacity:0.5
  }
  60% {
    transform: scale(0.6, 0.6);
    opacity:0.5
  }
  65% {
    transform: scale(0.8, 0.8);
    opacity:0.5
  }
  70% {
    transform: scale(1, 1);
    opacity:0.5
  }
  80% {
    transform: scale(1.4,1.4);
  }
  100%{
    transform: scale(1.4,1.4);
    opacity:0
  }
  `;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 0,
        width: "100%",
        height: `100%`,
        borderRadius: "inherit",
        scrollSnapAlign: "start",
        borderRadius: "inherit",
        "& > video": {
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
          objectFit: "cover",
          border: "1px solid red",
          "mix-blend-mode": "multiply"
        },
        ...styles.root
      }}
    >
      <video
        src={src}
        ref={videoRef}
        controls={false}
        onClick={handleClick}
        {...props}
      />
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          "& > *": {
            transform: "scale(0)",
            opacity: 1
          }
        }}
      >
        {isPlaying ? (
          <IconButton
            key={isPlaying}
            // className={typeof isPlaying === "boolean" ? "zoom-in" : ""}
            sx={{
              animation: typeof isPlaying === "boolean" ? `${zoom} 0.75s` : ""
            }}
          >
            <PauseIcon />
          </IconButton>
        ) : (
          <IconButton
            key={isPlaying}
            // className={typeof isPlaying === "boolean" ? "zoom-in" : ""}
            sx={{
              animation: typeof isPlaying === "boolean" ? `${zoom} 0.75s` : ""
            }}
          >
            <PlayIcon />
          </IconButton>
        )}
      </Box>
      <div
        style={{
          display: hideTimeline && hideControls ? "none" : "block",
          zIndex: 1,
          position: "absolute",
          width: "100%",
          padding: "0px 16px",
          left: 0,
          bottom: -6,
          ...styles.footer
        }}
      >
        <Box
          id="controls"
          sx={{ display: hideControls ? "none" : "block" }}
        ></Box>
        <Box id="timeline" sx={{ display: hideTimeline ? "none" : "block" }}>
          <Slider
            size="small"
            value={values.seek}
            onChange={handleGoto}
            onInput={props => console.log(props)}
            valueLabelDisplay="auto"
          />
        </Box>
      </div>
    </Box>
  );
};

VideoPlayer.propTypes = {};

export default VideoPlayer;
