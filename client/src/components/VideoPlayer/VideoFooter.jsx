import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useTheme, Typography, ClickAwayListener } from "@mui/material";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import PauseIcon from "@mui/icons-material/Pause";
import PlayIcon from "@mui/icons-material/PlayArrow";
import IconButton from "@mui/material/IconButton";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import Tooltip from "@mui/material/Tooltip";

const VideoFooter = ({
  hideTimeline,
  hideControls,
  hideTimeBox = true,
  loading,
  contRef,
  timeMap = {
    duration: {
      min: 0,
      sec: 0
    },
    cTime: {
      min: 0,
      sec: 0
    },
    seek: 0
  },
  defaultVolume = 0,
  muted = false,
  paused = true,
  hasAudio,
  handleGoto,
  handleVolume,
  handlePlay,
  handlePause,
  withOverlay,
  fullScreenMode
}) => {
  muted = !hasAudio || muted;
  const blend = useTheme().palette.common.blend;
  const [volume, setVolume] = useState(defaultVolume);
  const [openVolume, setOpenVolume] = useState(false);
  const volumeBtnRef = useRef();

  const toggleFullscreenMode = e => {
    e.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen();
    else contRef.current.requestFullscreen();
  };
  const hideMainBox = hideTimeline && hideControls;

  const handleVolumeClose = () => {
    setOpenVolume(false);
  };

  const handleVolumeOpen = () => setOpenVolume(true);

  const onVolumePopperAwayListener = e => {
    const bool = volumeBtnRef.current.contains(e.target);

    setOpenVolume(bool);
  };

  useEffect(() => {
    fullScreenMode && setOpenVolume(false);
  }, [fullScreenMode]);

  return (
    <Box
      className="video-player-footer"
      sx={{
        zIndex: 1,
        opacity: 1,
        width: "100%",
        position: "absolute",
        transition: "all ease-in-out .25s",
        bottom: 0,
        ...(loading ? { opacity: 0, pointerEvents: "none" } : undefined),
        ".video-player-footer-time-box": {
          position: "absolute",
          bottom: hideTimeline || hideMainBox ? 20 : 80,
          left: 20,
          zIndex: 1,
          padding: "4px 8px",
          minWidth: "44px",
          textAlign: "center",
          backgroundColor: "background.alt",
          borderRadius: "8px",
          display: hideTimeBox ? "none" : "block"
        },
        ".video-player-footer-main-box": {
          position: "absolute",
          width: "100%",
          padding: "8px 16px",
          left: 0,
          bottom: "0",
          background: blend,
          borderTopRightRadius: "4px",
          borderTopLeftRadius: "4px"
        }
      }}
    >
      {hideMainBox ? null : (
        <Box className="video-player-footer-main-box">
          {hideTimeline ? null : (
            <Box className="video-player-timeline">
              <Slider
                sx={{ cursor: "pointer", zIndex: 1 }}
                size="small"
                value={timeMap.seek}
                onChange={handleGoto}
                valueLabelDisplay="auto"
                key="main-timeline"
              />
            </Box>
          )}
          {hideControls ? null : (
            <Box
              className="video-player-controls"
              sx={{
                pt: "8px",
                "*": {
                  color: "common.white"
                },
                ".MuiIconButton-root": {
                  width: "25px",
                  height: "25px",
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "grey.800"
                  },
                  svg: {
                    fontSize: ".9em"
                  }
                }
              }}
            >
              <Stack gap={0} sx={{ ml: "-13px" }} flexWrap="wrap">
                {paused ? (
                  <IconButton onClick={handlePlay}>
                    <PlayIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={handlePause}>
                    <PauseIcon />
                  </IconButton>
                )}
                <Stack sx={{ mr: "-13px" }} flexWrap="wrap">
                  <Typography>
                    {timeMap.duration ? (
                      <>
                        {`${timeMap.cTime.mins}:${(
                          timeMap.cTime.secs + ""
                        ).padStart(2, "0")}`}{" "}
                        /{" "}
                        {`${timeMap.duration.mins}:${(
                          timeMap.duration.secs + ""
                        ).padStart(2, "0")}`}
                      </>
                    ) : null}
                  </Typography>
                  {hasAudio ? (
                    <Tooltip
                      key={hasAudio}
                      disableTouchListener
                      disableFocusListener
                      open={openVolume}
                      onOpen={handleVolumeOpen}
                      onClose={handleVolumeClose}
                      placement="top"
                      id="voulme-popper-cont"
                      componentsProps={{
                        popper: {
                          id: "volume-popper",
                          sx: {
                            display: withOverlay ? "none" : "block",
                            ".MuiTooltip-tooltip": {
                              height: "150px",
                              py: 3,
                              px: 2
                            }
                          }
                        }
                      }}
                      arrow={false}
                      title={
                        <div style={{ height: "100%" }}>
                          <ClickAwayListener
                            onClickAway={onVolumePopperAwayListener}
                          >
                            <Slider
                              orientation="vertical"
                              size="small"
                              value={volume}
                              aria-label="Small"
                              valueLabelDisplay="auto"
                              onChange={(e, v) => {
                                e.stopPropagation();
                                v = (v - 1) / 99;
                                v = v >= 0 ? v : 0;
                                setVolume(Math.round(v * 100));
                                handleVolume(v.toFixed(1), e);
                              }}
                              id="volume-slider"
                            />
                          </ClickAwayListener>
                        </div>
                      }
                    >
                      <span>
                        <IconButton
                          tabIndex={1}
                          onClick={handleVolumeOpen}
                          id="volume-button"
                          ref={volumeBtnRef}
                        >
                          {muted ? (
                            <VolumeOffIcon />
                          ) : volume ? (
                            <VolumeUpIcon />
                          ) : (
                            <VolumeDownIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      placement="bottom"
                      arrow={false}
                      title={"No audio"}
                    >
                      <IconButton
                        disableRipple
                        sx={{ "*": { cursor: "not-allowed" } }}
                      >
                        <VolumeOffIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {contRef.current?.requestFullscreen ? (
                    <IconButton onClick={toggleFullscreenMode}>
                      {document.fullscreenElement ? (
                        <FullscreenExitIcon />
                      ) : (
                        <FullscreenIcon />
                      )}
                    </IconButton>
                  ) : null}
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>
      )}
      {
        <Typography className="video-player-footer-time-box">
          {`${timeMap.cTime.mins}:${(timeMap.cTime.secs + "").padStart(
            2,
            "0"
          )}`}
        </Typography>
      }
    </Box>
  );
};

VideoFooter.propTypes = {};

export default VideoFooter;
