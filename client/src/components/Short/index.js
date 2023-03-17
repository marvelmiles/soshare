import React, { useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Box, Avatar, Typography, IconButton, Stack } from "@mui/material";
import VideoPlayer from "components/VideoPlayer";
import EditIcon from "@mui/icons-material/Edit";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import { useSelector } from "react-redux";
import { useContext } from "redux/store";
import http from "api/http";
import ShortFooter from "./ShortFooter";
import ShortSidebar from "./ShortSidebar";
import { StyledLink } from "components/styled";
import { useNavigate } from "react-router-dom";

const Short = React.forwardRef(
  (
    {
      short = {
        likes: {},
        user: {},
        views: {}
      },
      miniShort,
      handleAction,
      loop,
      mx
    },
    ref
  ) => {
    const { id } = useSelector(state => state.user.currentUser || {});
    const { setSnackBar } = useContext();
    const stateRef = useRef({}).current;
    const {
      palette: {
        background: { blend }
      }
    } = useTheme();
    const navigate = useNavigate();
    const onTimeUpdate = useCallback(async () => {
      try {
        if (miniShort || short.views[id]) return;
        handleAction("update", {
          id: short.id,
          views: await http.patch(`/shorts/${short.id}/view`)
        });
      } catch (msg) {
        console.log(msg);
      }
    }, [short.id, short.views, id, handleAction, miniShort]);
    // console.log(short.pause, "is oner");

    return (
      <Box
        ref={ref}
        sx={{
          position: "relative",
          borderRadius: 3,
          width: miniShort
            ? {
                xs: "100%",
                md: "110px"
              }
            : "100%",
          // maxWidth: miniShort ? "150px" : undefined,
          height: miniShort ? "200px" : "80vh",
          mb: 1,
          // mx: "auto",
          "&:last-of-type": {
            // mx: 2
          }
          // border: "1px solid red"
        }}
      >
        <VideoPlayer
          loop={loop}
          src={short.url}
          hideControls
          pause={short.pause}
          autoPlay={!miniShort}
          withIntersection={!miniShort}
          hoverPlayDelay={miniShort && 1000}
          hideTimeline={miniShort}
          onTimeUpdate={onTimeUpdate}
          onClick={
            miniShort ? () => navigate(`/shorts?ref=${short.id}`) : undefined
          }
        />

        <ShortFooter
          user={short.user}
          text={short.text}
          views={short.views ? Object.keys(short.views).length : 0}
          miniShort={miniShort}
          isOwner={short.user.id === id}
          id={short.id}
          handleAction={handleAction}
        />
        <ShortSidebar
          id={short.id}
          isOwner={short.user.id === id}
          user={short.user}
          handleAction={handleAction}
        />
      </Box>
    );
  }
);

Short.propTypes = {};

export default Short;
