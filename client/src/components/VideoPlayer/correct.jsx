import React, { useRef, useEffect, useCallback, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import useViewIntersection from "hooks/useViewIntersection";
import { useTheme } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import PauseIcon from "@mui/icons-material/Pause";
import PlayIcon from "@mui/icons-material/PlayArrow";
import { zoom } from "components/styled";
import { useContext } from "context/store";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { setAspectRatio } from "utils";
import ReplayIcon from "@mui/icons-material/Replay";
import Loading from "components/Loading";
import VideoFooter from "./VideoFooter";
import mp4 from "components/resized.mp4";

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
            footerSx,
            nativeFile,
            withKeyEvents,
            sx,
            onReload,
            backdrops = {},
            enableIndicator = true,
            intersectionProps,
            ...props
        },
        ref
    ) => {
        const { setSnackBar } = useContext();
        const [loading, setLoading] = useState(true);
        const [isPlaying, setIsPlaying] = useState(undefined);
        const [values, setValues] = useState({ seek: 0 });
        const videoRef = useRef();
        const stateRef = useRef({
            intersectionProps: withIntersection
                ? {
                    threshold: 0.4,
                    ...intersectionProps
                }
                : undefined
        });
        const [backdrop, setBackdrop] = useState("");
        const { isIntersecting } = useViewIntersection(
            !loading && withIntersection && videoRef,
            stateRef.current.intersectionProps
        );
        const [videoUrl, setVideoUrl] = useState();
        const blend = useTheme().palette.common.blend;
        const handlePlay = useCallback(
            (prop = {}) => {
                if (!videoRef.current) return;
                if (videoRef.current.paused) {
                    let { enableIndicator, emitFn, delay = 0, ...rest } = {
                        enableIndicator: false,
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
                            .finally(() => setBackdrop(""));
                    }, delay);
                }
            },
            [onPlay, onError]
        );
        const handlePause = useCallback(
            (prop = {}) => {
                let { enableIndicator = false, emitFn = false, ...rest } = prop;
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
        const handleClick = useCallback(
            e => {
                e.stopPropagation();
                const playProp = {
                    enableIndicator
                };
                if (videoRef.current.paused) handlePlay(playProp);
                else handlePause(playProp);

                stateRef.current.userClicked = true;
                onClick && onClick(e);
            },
            [enableIndicator, handlePause, handlePlay, onClick]
        );

        useEffect(() => {
            let url;

            if (src) setVideoUrl(mp4);
            else if (nativeFile) {
                url = URL.createObjectURL(nativeFile);
                setVideoUrl(url);
            }
            setValues({ seek: 0 });
            return () => url && URL.revokeObjectURL(url);
        }, [nativeFile, src]);

        useEffect(() => {
            const video = videoRef.current;
            const state = stateRef.current;
            if (videoUrl && video) {
                let onMouseEnter, onMouseLeave;

                const handleTimeUpdate = () => {
                    const dur = video.duration;
                    let dur_min = Math.floor(dur / 60);
                    let dur_sec = Math.floor(dur % 60);
                    const cTime = video.currentTime;
                    let cTime_min = Math.floor(cTime / 60);
                    let cTime_sec = Math.floor(cTime % 60);
                    const durMiliTime = Math.floor(dur * 1000);
                    const cMiliTime = Math.floor(cTime * 1000);

                    const durationReached = (duration, threshold = playingThreshold) => {
                        let maxDur = duration;
                        if (dur_min < 1) maxDur = threshold * durMiliTime;
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
                            min: dur_min,
                            sec: dur_sec
                        },
                        cTime: {
                            min: cTime_min,
                            sec: cTime_sec
                        },
                        seek: Math.floor((cTime / dur) * 100) || 0
                    };

                    setValues(prop);
                };

                const handleVideoEnd = () => setBackdrop("replay");

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

                    setLoading(false);
                    // setAspectRatio(video);

                    onLoadedMetadata && onLoadedMetadata({ video });
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
                            if (backdrops["RELOAD"]) setBackdrop("reload");
                            else setSnackBar(error.message);
                            break;
                        case MediaError.MEDIA_ERR_NETWORK:
                            error.withReload = true;
                            error.severity = -1;
                            error.message =
                                "A network error caused the video download to fail.";
                            setBackdrop("reload");
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
                            setBackdrop("reload");
                            break;
                        default:
                            error.severity = 0;
                            error.message = "An unknown error occurred.";
                            break;
                    }

                    onError && onError(error);
                };

                if (hoverPlayDelay) {
                    onMouseEnter = e => {
                        e.stopPropagation();
                        if (!state.hasMouseHovered && !state.userClicked && video.paused) {
                            state.moueHoverTimer = setTimeout(() => {
                                state.hoverPlaying = true;
                                handlePlay({ mouseEnter: true });
                            }, hoverPlayDelay);
                        }
                        state.hasMouseHovered = true;
                    };
                    onMouseLeave = e => {
                        e.stopPropagation();
                        if (state.moueHoverTimer) {
                            clearTimeout(state.moueHoverTimer);
                            state.moueHoverTimer = undefined;
                            stateRef.current.muted = undefined;
                            video.currentTime = 0;
                            handlePause({ mouseLeave: true, emitFn: true, e });
                        }
                        state.hasMouseHovered = false;
                    };
                    video.addEventListener("mouseenter", onMouseEnter, false);
                    video.addEventListener("mouseleave", onMouseLeave, false);
                }

                if (autoPlay === undefined) {
                    if (withIntersection !== undefined) {
                        if (isIntersecting) {
                            state.hasMouseHovered = true;
                            stateRef.current.autoPlay = true;
                            handlePlay({
                                isIntersecting
                            });
                        } else {
                            state.userClicked = false;
                            handlePause({
                                isIntersecting
                            });
                        }
                    }
                } else if (autoPlay) {
                    stateRef.current.autoPlay = true;
                    handlePlay({ isIntersecting });
                } else {
                    stateRef.current.autoPlay = false;
                    handlePause({ isIntersecting });
                }

                video.addEventListener("error", handleError, false);
                video.addEventListener("ended", handleVideoEnd, false);
                video.addEventListener("loadedmetadata", handleLoadedMetadata, false);
                video.addEventListener("timeupdate", handleTimeUpdate, false);

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
                };
            }
        }, [
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
                withIntersection
            ]);

        useEffect(() => {
            let onKeyDown;
            if (videoUrl) {
                if (!backdrop && !loading) {
                    const playProp = {
                        enableIndicator: true
                    };
                    if (withKeyEvents) {
                        onKeyDown = e => {
                            if (e.code === "Space") {
                                stateRef.current._processing = true;
                                if (videoRef.current.paused) handlePlay(playProp);
                                else handlePause(playProp);
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

        const handleReload = useCallback(
            e => {
                e.stopPropagation();
                setBackdrop("");
                setLoading(true);
                onReload && onReload();
                if (!videoRef.current.paused) videoRef.current.pause();
                videoRef.current.load();
            },
            [onReload]
        );

        const handleReplay = useCallback(
            e => {
                e.stopPropagation();
                stateRef.current.hasPlayed = false;
                videoRef.current.currentTime = 0;
                handlePlay({ delay: 0, replaying: true });
            },
            [handlePlay]
        );

        const withOverlay = (backdrop && backdrop !== "replay") || loading;

        if (pause && videoRef.current && !videoRef.current.paused)
            videoRef.current.pause();

        // return <video className="video-player" src={videoUrl} />;

        return (
            <Box
                className="custom-video-player"
                onClick={e => e.stopPropagation()}
                key={videoUrl}
                sx={{
                    width: "100%",
                    height: "inherit",
                    minHeight: withOverlay ? "200px" : "",
                    // pb: withOverlay ? "" : "56.25%",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid red",
                    "& .custom-video": {
                        maxHeight: "100%",
                        maxWidth: "100%",
                        maxWidth: "100%",
                        width: "100%",
                        height: "100%",
                        // position: "absolute",
                        // top: "0",
                        // left: "0",
                        objectFit: "fill",
                        borderRadius: "inherit",
                        border: "2px solid green"
                    },

                    ".video-player-footer": {
                        opacity: 1,
                        pointerEvents: "none",
                        zIndex: 1,
                        position: "absolute",
                        width: "100%",
                        padding: "0px 16px",
                        left: 0,
                        bottom: 0,
                        transition: "all ease-in-out .25s",
                        background: blend,
                        py: 1,
                        borderTopRightRadius: "4px",
                        borderTopLeftRadius: "4px",
                        ...(loading ? { opacity: 0, pointerEvents: "none" } : undefined),
                        ...footerSx
                    },
                    "&:hover": {
                        ".video-player-footer": loading
                            ? undefined
                            : {
                                pointerEvents: "all",
                                opacity: "1"
                            }
                    },
                    // border: "2px solid red",
                    ...sx
                }}
            >
                {backdrop ? (
                    <div className="custom-overlay">
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
                                <IconButton onClick={handleReplay}>
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
                        variant="rectangular"
                        animation="wave"
                        className="custom-overlay custom-media custom-video"
                    />
                ) : null}

                <video
                    {...props}
                    className={`custom-media custom-video video ${props.videoClassName ||
                        ""}`}
                    autoPlay={stateRef.current.autoPlay}
                    src={videoUrl}
                    ref={videoRef}
                    onClick={handleClick}
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
                {hideTimeline && hideControls ? null : (
                    <VideoFooter handleGoto={handleGoto} seek={values.seek} />
                )}
            </Box>
        );
    }
);

VideoPlayer.propTypes = {};

export default VideoPlayer;
