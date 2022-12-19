import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import ReactCarousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Box, Stack, IconButton } from "@mui/material";
import img5 from "../imgs/img2.jpg";
import img4 from "../imgs/img3.jpg";
import img3 from "../imgs/img4.jpg";
import img2 from "../imgs/img5.jpg";
import img1 from "../imgs/img1.jpg";
import useTouchDevice from "../hooks/useTouchDevice";
import { Image } from "./styled";
import VideoPlayer from "./VideoPlayer";
import { useTheme } from "@mui/material";
const Carousel = ({
  medias = [],
  // medias = [
  //   {
  //     url: img1,
  //     type: "image"
  //   },
  //   {
  //     url: img2,
  //     type: "image"
  //   },
  //   {
  //     url: img3,
  //     type: "image"
  //   },
  //   {
  //     url: img4,
  //     type: "video"
  //   },
  //   {
  //     url: img5,
  //     type: "video"
  //   }
  // ],
  display = "block",
  height = "400px",
  borderRadius = "12px",
  nativeFile = false,
  stateRef,
  actionBar
}) => {
  const {
    palette: {
      background: { blend }
    }
  } = useTheme();
  const { isTouchDevice } = useTouchDevice();

  height = medias ? height : "0px";

  const renderMedias = () => {
    const _medias = [];
    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
      _medias.push(
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
              top: 0
            }
          }}
        >
          <Stack
            id="action-bar"
            sx={{
              position: "relative",
              "& > div": {
                position: "absolute",
                top: 10,
                right: 10,
                background: blend,
                p: "5px",
                borderRadius: "16px",
                minWidth: "30px",
                color: "common.light",
                zIndex: 1
              }
            }}
          >
            <div>
              {i + 1}/{medias.length}
            </div>
          </Stack>
          <div id="media-container">
            {(media.type || media.mimetype).indexOf("image") > -1 ? (
              <Image
                src={nativeFile ? URL.createObjectURL(media) : media.url}
              />
            ) : (
              <VideoPlayer />
            )}
          </div>
        </Box>
      );
    }
    return _medias;
  };
  return (
    <Box
      sx={{
        display,
        borderRadius,
        height,
        my: 1,
        position: "relative",
        ".react-multi-carousel-list": {
          borderRadius,
          height
        }
      }}
    >
      <Stack
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1
        }}
      >
        {actionBar}
      </Stack>
      <ReactCarousel
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
        afterChange={beforeSlide => {
          stateRef.currentSlide = beforeSlide + 1;
        }}
      >
        {renderMedias()}
      </ReactCarousel>
    </Box>
  );
};

Carousel.propTypes = {};

export default Carousel;
