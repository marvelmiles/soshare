import React, { forwardRef, useMemo } from "react";
import PropTypes from "prop-types";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Box, Stack, IconButton } from "@mui/material";
import useTouchDevice from "hooks/useTouchDevice";
import Image from "components/Image";
import VideoPlayer from "components/VideoPlayer";
import { useTheme } from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";

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
      height = "300px",
      borderRadius = "12px",
      actionBar,
      showIndicator = true,
      videoPlayerProps,
      beforeChange
    },
    ref
  ) => {
    const {
      palette: {
        background: { blend }
      }
    } = useTheme();
    const { isTouchDevice } = useTouchDevice();
    const backdrops = useMemo(
      () => ({
        MIMETYPE_ERROR: true
      }),
      []
    );
    if (!medias.length) return null;
    height = medias ? height : "0px";
    return (
      <Box
        onClick={e => e.preventDefault()}
        sx={{
          display,
          borderRadius,
          height,
          my: 1,
          position: "relative",
          width: "100%",
          ".react-multi-carousel-list": {
            borderRadius,
            height,
            width: "100%"
          }
        }}
      >
        <Stack
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1,
            "& button": {
              "&:hover,&:focus,&:active": {
                backgroundColor: "common.blendHover"
              }
            }
          }}
        >
          {actionBar}
        </Stack>
        <Carousel
          key={1}
          ref={ref}
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
          beforeChange={beforeChange}
          customRightArrow={<CustomRightArrow />}
          customLeftArrow={<CustomLeftArrow />}
        >
          {medias.map((m, i) => {
            const isFile = m instanceof File;
            return (
              <Box
                key={i}
                sx={{
                  borderRadius,
                  position: "relative",
                  minWIdth: 0,
                  width: "100%",
                  "& #media-container": {
                    height,
                    borderRadius: "inherit",
                    top: 0,
                    backgroundColor: "common.white"
                  }
                }}
              >
                {showIndicator ? (
                  <Stack
                    sx={{
                      position: "relative",
                      "& > button": {
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: blend,
                        borderRadius: "16px",
                        minWidth: "30px",
                        zIndex: 1,
                        border: "1px solid currentColor",
                        borderColor: "divider",
                        "&:hover,&:focus,&:active": {
                          backgroundColor: "common.blendHover"
                        }
                      }
                    }}
                  >
                    <IconButton
                      sx={{
                        fontSize: "12px"
                      }}
                    >
                      {i + 1}/{medias.length}
                    </IconButton>
                  </Stack>
                ) : null}
                <div id="media-container">
                  {(m.type || m.mimetype).indexOf("image") > -1 ? (
                    <Image nativeFile={isFile && m} src={m.url} key={m.id} />
                  ) : (
                    <VideoPlayer
                      mimetype={m.mimetype || m.type}
                      nativeFile={isFile && m}
                      src={m.url}
                      styles={{
                        footer: {
                          bottom: 5
                        }
                      }}
                      {...videoPlayerProps}
                      key={m.id}
                      backdrops={backdrops}
                    />
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
  borderColor: "divider",
  "&:hover": {
    backgroundColor: "common.blendHover"
  }
};
