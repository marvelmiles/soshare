import React from "react";
import PropTypes from "prop-types";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/system";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export const LoadingDot = ({ label, color = "primary.main", sx }) => {
  const dot1 = keyframes({
    "0%": {
      transform: "scale(0)"
    },
    "100%": {
      transform: "scale(1)"
    }
  });

  const dot2 = keyframes({
    "0%": {
      transform: "translate(0, 0)"
    },
    "100%": {
      transform: "translate(20px, 0)"
    }
  });

  const dot3 = keyframes({
    "0%": {
      transform: "scale(1)"
    },
    "100%": {
      transform: "scale(0)"
    }
  });
  return (
    <Stack gap={0} flexWrap="wrap" sx={sx} className="custom-loading-dot">
      {label ? (
        <Typography
          sx={{ textTransform: "capitalize" }}
          color={color}
          variant="h5"
        >
          {label}
        </Typography>
      ) : null}
      <Box
        sx={{
          display: "inline-block",
          position: "relative",
          width: "64px",
          height: "14px",
          "& div": {
            position: "absolute",
            top: "4px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: color,
            animationTimingFunction: "cubic-bezier(0, 1, 1, 0)"
          },
          "& div:nth-of-type(1)": {
            left: "6px",
            animation: `${dot1} 0.6s infinite`
          },
          "& div:nth-of-type(2)": {
            left: "0px",
            animation: `${dot2} 0.6s infinite`
          },
          "& div:nth-of-type(3)": {
            left: "20px",
            animation: `${dot2} 0.6s infinite`
          },
          "& div:nth-of-type(4)": {
            left: "38px",
            animation: `${dot3} 0.6s infinite`
          }
        }}
      >
        <div />
        <div />
        <div />
        <div />
      </Box>
    </Stack>
  );
};

const Loading = ({ sx, className, ...rest }) => {
  return (
    <Stack
      justifyContent="center"
      sx={{
        color: "primary.main",
        width: "100%",
        minWidth: "100%",
        height: "inherit",
        minHeight: "inherit",
        ...sx
      }}
      className={`custom-loading ${className}`}
    >
      <CircularProgress
        value={60}
        thickness={4}
        size={20}
        {...rest}
        sx={{ color: "primary.main" }}
      />
    </Stack>
  );
};

Loading.propTypes = {};

export default Loading;
