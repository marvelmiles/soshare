import React, { useEffect, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import { setAspectRatio } from "utils";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useContext } from "context/store";
// import imgJPG from "components/img1.jpg";

const Image = ({
  sx,
  nativeFile,
  src,
  className = "",
  inFullscreen,
  maxReload = 4,
  ...props
}) => {
  const { isOnline } = useContext();
  const stateRef = useRef({
    reloadCount: 0,
    maxReload,
    loaded: false
  });
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [showBackdrop, setShowBackdrop] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    setUrl(src || URL.createObjectURL(nativeFile));
    return () => URL.revokeObjectURL(nativeFile);
  }, [src, nativeFile]);

  const handleReload = useCallback(e => {
    e && e.stopPropagation();
    setShowBackdrop(false);
    setLoading(true);
    imgRef.current.src = imgRef.current.src;
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (url && img) {
      const handleImageLoad = () => {
        stateRef.current.loaded = true;
        stateRef.current.reloadCount = 0;

        setAspectRatio(img);
        setLoading(false);
        setShowBackdrop(false);
      };
      img.addEventListener("load", handleImageLoad);
      img.addEventListener("error", e => {
        if (
          stateRef.current.reloadCount &&
          stateRef.current.reloadCount < stateRef.current.maxReload
        ) {
          stateRef.current.reloadCount++;
          handleReload();
        } else {
          stateRef.current.reloadCount = 0;
          stateRef.current.loaded = false;
          setShowBackdrop(true);
          setLoading(false);
        }
      });
      return () => {
        img.removeEventListener("load", handleImageLoad);
        URL.revokeObjectURL(url);
      };
    }
  }, [url, handleReload]);

  useEffect(() => {
    if (isOnline) {
      if (!stateRef.current.loaded) {
        stateRef.current.reloadCount = 1;
        handleReload();
      }
    }
  }, [isOnline, handleReload]);

  const withOverlay = loading || showBackdrop || true;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "0",
        minHeight: withOverlay ? "200px" : "",
        pb: withOverlay ? "" : "56.25%",
        overflow: "hidden",
        border: "1px solid currentColor",
        borderColor: "divider",
        "&::before": {
          content: `""`,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          ...(showBackdrop
            ? undefined
            : {
                backgroundImage:
                  "linear-gradient(rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.25))",
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                mixBlendMode: "lighten"
              })
        },
        ...sx
      }}
      className={`custom-media-container ${className}`}
      {...props}
    >
      {showBackdrop ? (
        <div className="custom-overlay">
          <div>
            <Typography>
              Network failed or browser don't support format
            </Typography>
            <Button variant="contained" onClick={handleReload} sx={{ mt: 1 }}>
              Reload
            </Button>
          </div>
        </div>
      ) : null}
      {loading ? (
        <Skeleton
          variant="rectangular"
          animation="wave"
          className="custom-overlay"
        />
      ) : null}
      <img
        // crossOrigin="anonymous"
        className={"custom-media image"}
        src={url}
        ref={imgRef}
      />
    </Box>
  );
};

Image.propTypes = {};

export default Image;
