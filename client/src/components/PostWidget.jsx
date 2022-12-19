import React, { useState } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { WidgetContainer, StyledTypography, StyledLink } from "./styled";
import {
  Stack,
  Avatar,
  Typography,
  Box,
  Button,
  IconButton
} from "@mui/material";
import Carousel from "./Carousel";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import FollowMe from "./FollowMe";
import { useContext } from "../redux/store";

const PostWidget = ({ maxHeight }) => {
  const [showAll, setShowAll] = useState(false);
  const { currentUser } = useSelector(state => state.user);
  const { setSnackBar } = useContext();
  const toggleLike = () => {
    if (currentUser) {
    } else setSnackBar();
  };
  return (
    <WidgetContainer
      sx={{
        maxHeight
      }}
    >
      <FollowMe />
      <Box
        sx={{
          my: 2,
          h5: {
            display: "inline",
            color: "common.main"
          }
        }}
      >
        <Typography variant="h5">
          Sint Lorem do ad esse nulla occaecat incididunt occaecat. Aliqua
          deserunt amet exercitation irure. Labore elit dolore laboris qui
          eiusmod esse consectetur ad ad ex id. Est cupidatat voluptate laborum
          ipsum id nostrud culpa eu. Eu id consequat ut exercitation ad eu.
          Aliqua deserunt aliqua sit minim deserunt mollit qui consectetur
          mollit nostrud nisi do in. Pariatur voluptate est Lorem elit.
        </Typography>
        {showAll ? (
          <Typography variant="h5">
            {" "}
            main seconda more do ad esse nulla occaecat incididunt occaecat.
            Aliqua deserunt amet exercitation irure. Labore elit dolore laboris
            qui eiusmod esse consectetur ad ad ex id. Est cupidatat voluptate
            laborum ipsum id nostrud culpa eu. Eu id consequat ut exercitation
            ad eu. Aliqua deserunt aliqua sit minim deserunt mollit qui
            consectetur mollit nostrud nisi do in. Pariatur voluptate est Lorem
            elit.
          </Typography>
        ) : null}
        <StyledTypography
          variant="link"
          sx={{ ml: 1 }}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show less" : "Show more"}
        </StyledTypography>
      </Box>
      <Carousel />
      <Stack flexWrap="wrap">
        <Stack flexWrap="wrap">
          <Stack>
            <IconButton onClick={toggleLike}>
              <FavoriteOutlinedIcon />
            </IconButton>
            <Typography> 45666</Typography>
          </Stack>
          <Stack>
            <IconButton>
              <ChatBubbleOutlineOutlinedIcon />
            </IconButton>
            <Typography> 45666</Typography>
          </Stack>
        </Stack>
        <IconButton>
          <ShareOutlinedIcon />
        </IconButton>
      </Stack>
    </WidgetContainer>
  );
};

PostWidget.propTypes = {};

export default PostWidget;
