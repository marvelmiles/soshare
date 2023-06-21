import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";

const Image = ({ sx, nativeFile, src, className = "", ...props }) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let url;

    if (src) setUrl(src);
    else if (nativeFile) {
      url = URL.createObjectURL(nativeFile);
      setUrl(url);
    }

    return () => url && URL.revokeObjectURL(url);
  }, [nativeFile, src]);
  return url ? (
    <Box
      component="img"
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        borderRadius: "12px",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        ...sx
      }}
      onClick={e => e.stopPropagation()}
      className={`custom-image ${className}`}
      {...props}
      src={url}
    />
  ) : null;
};

Image.propTypes = {};

export default Image;
