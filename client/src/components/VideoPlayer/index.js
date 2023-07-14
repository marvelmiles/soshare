import React, { useRef, useEffect, useCallback, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import useViewIntersection from "hooks/useViewIntersection";
import IconButton from "@mui/material/IconButton";
import PauseIcon from "@mui/icons-material/Pause";
import PlayIcon from "@mui/icons-material/PlayArrow";
import { zoom } from "components/styled";
import { useContext } from "context/store";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { setAspectRatio, getTimeMap } from "utils";
import ReplayIcon from "@mui/icons-material/Replay";
import Loading from "components/Loading";
import VideoFooter from "./VideoFooter";
import mp4 from "components/resized.mp4";
import { hasAudio } from "utils/validators";

const VideoPlayer = React.forwardRef(
  (
    {
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
      hoverPlayDuration = 30000,
      timeUpdateDuration = 30000,
      hoverPlayDelay = 0,
      playingThreshold = 0.4,
      pause,
      onLoadedMetadata,
      mimetype,
      nativeFile,
      withKeyEvents,
      sx,
      onReload,
      backdrops = {},
      enableIndicator = true,
      intersectionProps,
      className = "",
      contRef,
      onFullscreen,
      hideTimeBox,
      ...props
    },
    ref
  ) => {
    const { setSnackBar } = useContext();
    const stateRef = useRef({
      intersectionProps: withIntersection
        ? {
            threshold: 0.4,
            ...intersectionProps
          }
        : undefined,
      defaultTimeMap: {
        seek: 0,
        cTime: {
          mins: 0,
          secs: 0
        },
        duration: undefined
      }
    });
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(undefined);
    const [timeMap, setTimeMap] = useState(stateRef.current.defaultTimeMap);
    const videoRef = useRef();
    const _contRef = useRef();
    const [backdrop, setBackdrop] = useState("");
    const { isIntersecting } = useViewIntersection(
      !loading && withIntersection && videoRef,
      stateRef.current.intersectionProps
    );
    const [videoUrl, setVideoUrl] = useState();
    const showBackdrop = useCallback((openFor = "relaod") => {
      const wrapper = stateRef.current.wrapper;
      if (wrapper) {
        if (openFor) wrapper.classList.add("container-overlayed");
        else wrapper.classList.remove("container-overlayed");
      }
      setBackdrop(openFor);
    }, []);

    const handlePlay = useCallback(
      (prop = {}) => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
          let { enableIndicator, emitFn, delay = 0, ...rest } = {
            enableIndicator: true,
            emitFn: true,
            delay: 0,
            delay: 0,
            ...prop
          };
          if (!stateRef.current.hasPlayed) setBackdrop("loading");
          const id = setTimeout(() => {
            if (!videoRef.current) return;
            videoRef.current
              .play()
              .then(() => {
                stateRef.current.hasPlayed = true;
                enableIndicator && setIsPlaying(true);
                onPlay && emitFn && onPlay(videoRef.current, rest || {});
                clearTimeout(id);
              })
              .catch(onError ? onError : err => console.log(err))
              .finally(() => showBackdrop(""));
          }, delay);
        }
      },
      [onPlay, onError, showBackdrop]
    );
    const handlePause = useCallback(
      (prop = {}) => {
        let { enableIndicator = true, emitFn = true, ...rest } = prop;
        if (!videoRef.current) return;
        stateRef.current.autoPlay = false;
        if (!videoRef.current.paused) {
          if (emitFn === false && !stateRef.current.hasPlayed) emitFn = true;
          videoRef.current.pause();
          enableIndicator && setIsPlaying(false);
          onPause && emitFn && onPause(videoRef.current, rest || {});
        }
      },
      [onPause]
    );

    useEffect(() => {
      let url;

      if (src) setVideoUrl(mp4);
      else if (nativeFile) {
        url = URL.createObjectURL(nativeFile);
        setVideoUrl(url);
      }
      return () => url && URL.revokeObjectURL(url);
    }, [nativeFile, src]);

    useEffect(() => {
      const video = videoRef.current;
      const state = stateRef.current;
      const playPauseProp = {
        isIntersecting,
        enableIndicator: false
      };
      if (videoUrl && video) {
        const wrapperRef = contRef?.current || _contRef?.current;
        stateRef.current.wrapper = wrapperRef;
        if (autoPlay === undefined) {
          if (withIntersection !== undefined) {
            if (!isIntersecting) {
              state.userClicked = false;
              handlePause(playPauseProp);
            }
          }
        } else if (!autoPlay) {
          stateRef.current.autoPlay = false;
          handlePause(playPauseProp);
        }
        const onMouseEnter = e => {
          e.stopPropagation();
          if (!state.hasMouseHovered && !state.userClicked && video.paused) {
            state.moueHoverTimer = setTimeout(() => {
              state.hoverPlaying = true;
              handlePlay({ mouseEnter: true, e, enableIndicator: false });
            }, hoverPlayDelay);
          }
          state.hasMouseHovered = true;
        };
        const onMouseLeave = e => {
          e.stopPropagation();
          if (state.moueHoverTimer) {
            clearTimeout(state.moueHoverTimer);
            state.moueHoverTimer = undefined;
            stateRef.current.muted = undefined;
            video.currentTime = 0;
            handlePause({ mouseLeave: true, e, enableIndicator: false });
          }
          state.hasMouseHovered = false;
        };
        const handleTimeUpdate = () => {
          const { mins: durMins, secs: durSecs } = getTimeMap(video.duration);

          const { mins: cTimeMins, secs: cTimeSecs } = getTimeMap(
            video.currentTime
          );

          const durMiliTime = Math.floor(video.duration * 1000);
          const cMiliTime = Math.floor(video.currentTime * 1000);

          const durationReached = (duration, threshold = playingThreshold) => {
            let maxDur = duration;
            if (durMins < 1) maxDur = threshold * durMiliTime;
            return cMiliTime >= maxDur;
          };
          if (
            hoverPlayDelay &&
            state.hoverPlaying &&
            durationReached(hoverPlayDuration)
          )
            video.currentTime = 0;

          if (onTimeUpdate) {
            if (timeUpdateDuration) {
              if (!state.timeReached && durationReached(timeUpdateDuration)) {
                state.timeReached = true;
                onTimeUpdate(videoRef.current);
              }
            } else onTimeUpdate(videoRef.current);
          }
          const prop = {
            duration: {
              mins: durMins,
              secs: durSecs
            },
            cTime: {
              mins: cTimeMins,
              secs: cTimeSecs
            },
            seek: Math.floor((video.currentTime / video.duration) * 100) || 0
          };

          setTimeMap(prop);
        };

        const handleVideoEnd = () => showBackdrop("replay");

        const handleClick = e => {
          e.stopPropagation();
          const playPauseProp = {
            enableIndicator
          };
          if (videoRef.current.paused) handlePlay(playPauseProp);
          else handlePause(playPauseProp);

          stateRef.current.userClicked = true;
          onClick && onClick(e);
        };
        const handleFullscreenChange = () => {
          const node = document.fullscreenElement;
          if (stateRef.current.withFullscreen) {
            stateRef.current.withFullscreen = undefined;
            onFullscreen(node);
          } else if (wrapperRef === node) {
            stateRef.current.withFullscreen = true;
            onFullscreen(node);
          }
        };

        const handleError = ({ target: { error: err } }) => {
          video.parentElement.style.paddingBottom = "0px";
          setLoading(false);

          const error = {
            name: err.name,
            code: err.code,
            message: err.message
          };

          switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              error.severity = -1;
              error.message =
                "Unable to play stream or video playback aborted!";
              if (backdrops["RELOAD"]) {
                setBackdrop();
              } else setSnackBar(error.message);
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              error.withReload = true;
              error.severity = -1;
              error.message =
                "A network error caused the video download to fail.";
              setBackdrop();
              break;
            case MediaError.MEDIA_ERR_DECODE:
              error.severity = 1;
              error.message =
                "The video playback was aborted due to a corruption problem or because the video used features your browser did not support.";
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              error.withReload = true;
              error.severity = -1;
              error.message =
                "The video was not loaded, either because the server or network failed or because the format is not supported.";
              setBackdrop();
              break;
            default:
              error.severity = 0;
              error.message = "An unknown error occurred.";
              break;
          }

          onError && onError(error);
        };

        const handleLoadedMetadata = () => {
          if (video.canPlayType(mimetype) === "") {
            const error = {
              message:
                "Your browser is unable to process this video due to an unsupported format",
              code: "MIMETYPE_ERROR",
              severity: 1
            };
            if (backdrops[error.code]) {
              setLoading(false);
              setBackdrop(error.message);
            }
            return onError && onError(error);
          }

          stateRef.current.defaultVolume = video.volume * 100;

          hasAudio(video, bool => {
            stateRef.current.hasAudio = bool;

            setTimeMap({
              ...stateRef.current.defaultTimeMap,
              duration: getTimeMap(video.duration)
            });

            setAspectRatio(video);

            video.addEventListener("ended", handleVideoEnd, false);
            video.addEventListener("timeupdate", handleTimeUpdate, false);
            video.addEventListener("click", handleClick, false);
            document.addEventListener(
              "fullscreenchange",
              handleFullscreenChange,
              false
            );

            if (hoverPlayDelay) {
              video.addEventListener("mouseenter", onMouseEnter, false);
              video.addEventListener("mouseleave", onMouseLeave, false);
            }

            onLoadedMetadata && onLoadedMetadata({ video });
            setLoading(false);

            if (autoPlay === undefined) {
              if (withIntersection !== undefined) {
                if (isIntersecting) {
                  state.hasMouseHovered = true;
                  stateRef.current.autoPlay = true;
                  handlePlay(playPauseProp);
                }
              }
            } else if (autoPlay) {
              stateRef.current.autoPlay = true;
              handlePlay(playPauseProp);
            }
          });
        };

        video.addEventListener("error", handleError, false);
        video.addEventListener("loadedmetadata", handleLoadedMetadata, false);

        return () => {
          if (!state._noNext) {
            if (!video.paused && !state.hasMouseHovered) video.pause();
          }
          video.removeEventListener("end", handleVideoEnd, false);
          video.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata,
            false
          );
          video.removeEventListener("erorr", handleError, false);
          video.removeEventListener("timeupdate", handleTimeUpdate, false);
          video.removeEventListener("mouseenter", onMouseEnter, false);
          video.removeEventListener("mouseleave", onMouseLeave, false);
          video.removeEventListener("click", handleClick, false);
          document.removeEventListener(
            "fullscreenchange",
            handleFullscreenChange,
            false
          );
        };
      }
    }, [
      contRef,
      videoUrl,
      hoverPlayDuration,
      hoverPlayDelay,
      handlePlay,
      handlePause,
      playingThreshold,
      timeUpdateDuration,
      onTimeUpdate,
      onError,
      onLoadedMetadata,
      autoPlay,
      mimetype,
      setSnackBar,
      backdrops,
      isIntersecting,
      withIntersection,
      enableIndicator,
      onClick,
      onFullscreen,
      showBackdrop
    ]);

    useEffect(() => {
      let onKeyDown;
      if (videoUrl) {
        if (!backdrop && !loading) {
          if (withKeyEvents) {
            onKeyDown = e => {
              if (e.code === "Space") {
                stateRef.current._processing = true;
                if (videoRef.current.paused) handlePlay();
                else handlePause();
              }
            };
            window.addEventListener("keydown", onKeyDown, false);
          }
        }
      }
      return () => {
        window.removeEventListener("keydown", onKeyDown, false);
      };
    }, [
      handlePlay,
      handlePause,
      isIntersecting,
      withIntersection,
      withKeyEvents,
      videoUrl,
      backdrop,
      loading
    ]);

    const handleGoto = useCallback((e, v) => {
      e.stopPropagation();
      const ctime = (v * videoRef.current.duration) / 100;
      if (ctime >= 0) videoRef.current.currentTime = ctime;
    }, []);

    const handleVolume = useCallback(v => {
      const video = videoRef.current;
      if (video) {
        if (video.muted && v) video.muted = false;
        video.volume = v;
        stateRef.current.defaultVolume = v * 100;
      }
    }, []);

    const handleReload = useCallback(
      e => {
        e.stopPropagation();
        showBackdrop("");
        setLoading(true);
        onReload && onReload();
        if (!videoRef.current.paused) videoRef.current.pause();
        videoRef.current.load();
      },
      [onReload, showBackdrop]
    );

    const handleReplay = useCallback(
      e => {
        e.stopPropagation();
        stateRef.current.hasPlayed = false;
        videoRef.current.currentTime = 0;
        handlePlay({ replaying: true, enableIndicator: false });
      },
      [handlePlay]
    );

    const isReplaying = backdrop === "replay";

    const withOverlay = (backdrop && !isReplaying) || loading;

    if (pause && videoRef.current && !videoRef.current.paused)
      videoRef.current.pause();
    return (
      <Box
        className={`custom-video-player custom-media-container ${className} ${
          loading ? "loading" : ""
        }`}
        key={videoUrl}
        ref={node => {
          ref && (ref.current = node);
          _contRef.current = node;
        }}
        sx={{
          width: "100%",
          height: "100%",
          maxHeight: "inherit",
          minHeight: withOverlay ? "200px" : "",
          pb: withOverlay ? "" : "56.25%",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "common.black",
          borderRadius: "inherit",
          border: "1px solid currentColor",
          borderColor: "divider",
          "&:hover": {
            ".video-player-footer": loading
              ? undefined
              : {
                  pointerEvents: "all",
                  opacity: "1"
                }
          },
          ...sx
        }}
      >
        {backdrop ? (
          <div
            className="custom-overlay"
            style={{
              backgroundColor: isReplaying ? "transparent" : undefined
            }}
          >
            {{
              reload: (
                <div>
                  <Typography
                    variant="h5"
                    sx={{ maxWidth: "280px", mx: "auto" }}
                  >
                    Sorry video couldn't be downloaded or played
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleReload}
                    sx={{ mt: 1 }}
                  >
                    Reload
                  </Button>
                </div>
              ),
              replay: (
                <IconButton
                  sx={{ width: "40px", height: "40px" }}
                  onClick={handleReplay}
                >
                  <ReplayIcon />
                </IconButton>
              ),
              loading: <Loading />
            }[backdrop] || (
              <Typography variant="h5" sx={{ maxWidth: "280px", mx: "auto" }}>
                {backdrop}
              </Typography>
            )}
          </div>
        ) : null}
        {loading ? (
          <Skeleton
            className="custom-media custom-overlay"
            variant=""
            animation="wave"
            sx={{ zIndex: 0 }}
          />
        ) : null}

        <video
          {...props}
          className={`custom-media video ${props.videoClassName || ""}`}
          autoPlay={stateRef.current.autoPlay}
          src={videoUrl}
          ref={videoRef}
          controls={false}
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
              sx={{
                animation: typeof isPlaying === "boolean" ? `${zoom} 0.75s` : ""
              }}
            >
              <PauseIcon />
            </IconButton>
          ) : (
            <IconButton
              key={isPlaying}
              sx={{
                animation: typeof isPlaying === "boolean" ? `${zoom} 0.75s` : ""
              }}
            >
              <PlayIcon />
            </IconButton>
          )}
        </Box>
        {loading || (hideTimeline && hideControls) ? null : (
          <VideoFooter
            loading={loading}
            hideControls={hideControls}
            hideTimeline={hideTimeline}
            hideTimeBox={hideTimeBox}
            handleGoto={handleGoto}
            handleVolume={handleVolume}
            timeMap={timeMap}
            contRef={contRef || _contRef}
            defaultVolume={stateRef.current.defaultVolume}
            hasAudio={stateRef.current.hasAudio}
            paused={videoRef.current?.paused}
            handlePlay={handlePlay}
            handlePause={handlePause}
            withOverlay={backdrop || loading}
          />
        )}
      </Box>
    );
  }
);

VideoPlayer.propTypes = {};

export default VideoPlayer;
