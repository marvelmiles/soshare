import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ReactCarousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Box } from "@mui/material";
import img5 from "../imgs/img2.jpg";
import img4 from "../imgs/img3.jpg";
import img3 from "../imgs/img4.jpg";
import img2 from "../imgs/img5.jpg";
import img1 from "../imgs/img1.jpg";
import { isTouchDevice } from "../utils";
import { Image } from "./styled";
const Carousel = ({
  items = [
    {
      photoUrl: img1
    },
    {
      photoUrl: img2
    },
    {
      photoUrl: img3
    },
    {
      photoUrl: img4
    },
    {
      photoUrl: img5
    }
  ],
  height = "400px",
  borderRadius = "12px"
}) => {
  const [isTouch, setIsTouch] = useState(isTouchDevice());
  useEffect(() => {
    const onResize = () => {
      setIsTouch(isTouchDevice());
    };
    window.addEventListener("resize", onResize, false);
    return () => window.removeEventListener("resize", onResize, false);
  }, []);
  return (
    <Box
      sx={{
        borderRadius,
        height,
        my: 1,
        ".react-multi-carousel-list": {
          borderRadius,
          height
        }
      }}
    >
      <ReactCarousel
        arrows={isTouch ? false : true}
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
      >
        {items.map((l, i) => (
          <Box
            key={i}
            sx={{
              borderRadius,
              position: "relative",
              minWIdth: 0,
              width: "100%",
              "& > div": {
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: "common.main",
                p: "5px",
                borderRadius: "16px",
                minWidth: "30px",
                color: "common.light",
                zIndex: 1
              },
              img: {
                height,
                borderRadius: "inherit"
              }
            }}
          >
            <div>{`${i + 1}/${items.length}`}</div>
            <Image src={l.photoUrl} />
          </Box>
        ))}
      </ReactCarousel>
    </Box>
  );
};

Carousel.propTypes = {};

export default Carousel;
