import React, { forwardRef, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Box, Stack, IconButton } from "@mui/material";
import useTouchDevice from "hooks/useTouchDevice";
import Image from "components/Image";
import VideoPlayer from "components/VideoPlayer";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

const CustomRightArrow = ({ onClick, disabled }) => {
  return (
    <IconButton
      sx={{
        ...arrowStyles,
        right: "5px"
      }}
      disabled={disabled}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
    >
      <KeyboardArrowRightIcon />
    </IconButton>
  );
};

const CustomLeftArrow = ({ onClick, disabled }) => {
  return (
    <IconButton
      sx={{
        ...arrowStyles,
        left: "5px"
      }}
      disabled={disabled}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
    >
      <KeyboardArrowLeftIcon />
    </IconButton>
  );
};

const MediaCarousel = forwardRef(
  (
    {
      medias = [],
      display = "block",
      borderRadius = "12px",
      actionBar,
      showIndicator = true,
      videoPlayerProps,
      onCarouselChange
    },
    ref
  ) => {
    const carouselRef = useRef();
    const contRef = useRef();
    const stateRef = useRef({
      backdrops: {
        MIMETYPE_ERROR: true
      },
      intersectionProps: {
        threshold: 1,
        root: contRef
      }
    });

    const [prevSlide, setPrevSlide] = useState(-1);
    const [inFullscreen, setInFullscreen] = useState(false);
    const { isTouchDevice } = useTouchDevice();
    const onAfterChange = useCallback(
      (prev, prop) => {
        setPrevSlide(prev);
        prop.prevSlide = prev;
        onCarouselChange && onCarouselChange(prop.currentSlide, prop);
      },
      [onCarouselChange]
    );

    const onFullscreen = useCallback(node => setInFullscreen(!!node), []);

    if (!medias.length) return null;

    borderRadius = inFullscreen ? "0px" : borderRadius;

    const toggleFullscreen = e => {
      e.stopPropagation();
      if (document.fullscreenElement) document.exitFullscreen();
      else contRef.current.requestFullscreen();
      setInFullscreen(!document.fullscreenElement);
    };

    return (
      <Box
        ref={contRef}
        key={isTouchDevice}
        tabIndex="0"
        onClick={e => e.stopPropagation()}
        onBlur={e => {
          e.currentTarget.classList.remove("focus-within");
        }}
        onFocus={e => {
          if (!e.currentTarget.classList.contains("container-overlayed"))
            e.currentTarget.classList.add("focus-within");
        }}
        sx={{
          display,
          borderRadius,
          my: 1,
          position: "relative",
          width: "100%",
          height: "auto",
          overflow: "hidden",
          outline: 0,
          "&, & .custom-media-wrapper": {
            maxHeight: "100vh",
            overflow: "hidden"
          },

          ".react-multi-carousel-list": {
            borderRadius,
            height: "100%",
            overflow: "hidden"
          },
          "& .video-player-footer .video-player-footer-main-box": {
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 0.25s"
          },
          "& .video-player-footer .video-player-footer-time-box": {
            bottom: "10px",
            opacity: 1,
            pointerEvents: "all",
            transition: "opacity 0.25s"
          },
          "&:hover:not(.container-overlayed),&.focus-within": {
            "& .video-player-footer .video-player-footer-main-box": {
              opacity: 1,
              pointerEvents: "all",
              transition: "opacity 0.25s"
            },
            "& .video-player-footer .video-player-footer-time-box": {
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity 0.25s"
            }
          }
        }}
      >
        <Stack
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 2
          }}
        >
          {actionBar}
        </Stack>
        <Carousel
          ref={instance => {
            ref && (ref.current = instance);
            carouselRef.current = instance;
          }}
          draggable={false}
          swipeable={isTouchDevice}
          arrows={isTouchDevice ? false : true}
          responsive={{
            xs: {
              items: 1,
              breakpoint: { min: 0, max: 767 }
            },
            md: {
              items: 1,
              breakpoint: { min: 768, max: Infinity }
            }
          }}
          afterChange={onAfterChange}
          customRightArrow={<CustomRightArrow />}
          customLeftArrow={<CustomLeftArrow />}
        >
          {medias.map((m, i) => {
            const isFile = m instanceof File;
            const isVid = (m.type || m.mimetype).indexOf("video") > -1;
            return (
              <Box
                key={i}
                sx={{
                  borderRadius,
                  position: "relative",
                  minWidth: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  "& .custom-overlay": {
                    border: "none"
                  },
                  "& > .custom-media-wrapper": {
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    borderRadius: "inherit",
                    backgroundColor: "common.black",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid currentColor",
                    borderColor: "divider",
                    "& .custom-media-container": {
                      position: "unset",
                      borderRadius: 0,
                      border: "none"
                    }
                  }
                }}
              >
                {showIndicator && medias.length > 1 ? (
                  <IconButton
                    sx={{
                      fontSize: "12px",
                      position: "absolute",
                      top: 8,
                      right: 8,
                      borderRadius: "16px",
                      width: "auto",
                      height: "auto",
                      minWidth: "30px",
                      minHeight: "30px",
                      zIndex: 3,
                      border: "1px solid currentColor",
                      borderColor: "divider",
                      padding: "0px 6px"
                    }}
                  >
                    {i + 1} / {medias.length}
                  </IconButton>
                ) : null}
                <div className="custom-media-wrapper">
                  {isVid ? (
                    <VideoPlayer
                      mimetype={m.mimetype || m.type}
                      contRef={contRef}
                      nativeFile={isFile && m}
                      src={m.url}
                      {...videoPlayerProps}
                      key={i}
                      pause={i === prevSlide}
                      backdrops={stateRef.current.backdrops}
                      sx={{
                        ...videoPlayerProps?.sx,
                        "& .video-player-footer-main-box": inFullscreen
                          ? {
                              bottom: 0,
                              padding: "20px 28px",
                              paddingTop: "8px"
                            }
                          : {
                              bottom: 0
                            }
                      }}
                      onFullscreen={onFullscreen}
                      hideTimeBox={false}
                    />
                  ) : (
                    <div className="custom-inherit">
                      <Image
                        nativeFile={isFile && m}
                        src={m.url}
                        key={i}
                        inFullscreen={inFullscreen}
                      />
                      {contRef.current?.requestFullscreen ? (
                        <IconButton
                          onClick={toggleFullscreen}
                          sx={{ position: "absolute", bottom: 8, right: 8 }}
                        >
                          {inFullscreen ? (
                            <FullscreenExitIcon />
                          ) : (
                            <FullscreenIcon />
                          )}
                        </IconButton>
                      ) : null}
                    </div>
                  )}
                </div>
              </Box>
            );
          })}
        </Carousel>
      </Box>
    );
  }
);

MediaCarousel.propTypes = {};

export default MediaCarousel;

export const arrowStyles = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  border: "1px solid currentColor",
  borderColor: "divider"
};
