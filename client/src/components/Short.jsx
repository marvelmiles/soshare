import React from "react";
import PropTypes from "prop-types";
import { Box, Avatar, Typography, IconButton } from "@mui/material";
import VideoPlayer from "./VideoPlayer";
import AddIcon from "@mui/icons-material/Add";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material";
const Short = ({ width = "48%", maxWidth = "250px" }) => {
  const {
    palette: {
      background: { blend }
    }
  } = useTheme();
  return (
    <Box
      sx={{
        width,
        maxWidth,
        position: "relative",
        height: "200px",
        borderRadius: 2,
        overflow: "hidden",
        "& >*": {
          position: "absolute",
          left: 0,
          minWidth: 0,
          content: `""`
        },
        "& > div:last-child": {
          top: 0
        },
        "& > a": {
          top: 10,
          left: 10,
          cursor: "pointer",
          zIndex: 1
        }
      }}
    >
      {true ? (
        <IconButton
          component={Link}
          to=""
          sx={{
            width: "40px",
            height: "40px",
            backgroundColor: "primary.light",
            color: "primary.dark",
            "&:hover": {
              backgroundColor: "primary.light"
            }
          }}
        >
          <AddIcon sx={{ fontSize: "1em" }} />
        </IconButton>
      ) : (
        <Avatar
          sx={{
            width: "40px",
            height: "40px"
          }}
        />
      )}
      <Typography
        sx={{
          bottom: 0,
          left: 1,
          zIndex: 1,
          p: 1,
          pt: 2,
          color: "#fff",
          width: "100%",
          minWidth: 0,
          background: blend,
          aspectRatio: "6 / 1",
          wordBreak: "break-word"
        }}
      >
        {0} views • {22} likes
      </Typography>
      <VideoPlayer hideTimeline hideControls onClick={() => {}} />
    </Box>
  );
};

Short.propTypes = {};

export default Short;
