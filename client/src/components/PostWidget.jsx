import React, { useState, useRef } from "react";
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import http from "api/http";
import { useNavigate } from "react-router-dom";
import MoreActions from "./MoreActions";
import DeleteDialog from "./DeleteDialog";
import Comments from "./comments";
import moment from "moment";
const PostWidget = React.forwardRef(
  (
    {
      post = { text: "", medias: [], user: {}, likes: {}, comments: [] },
      handleAction,
      hideToolbox,
      showThread,
      docType = "post",
      caption,
      readOnly,
      plainWidget,
      mb,
      sx,
      isAuth
    },
    ref
  ) => {
    // console.log(docType, "dodocod");
    const [showAll, setShowAll] = useState(false);
    const { id } = useSelector(state => state.user.currentUser || {});
    const { setSnackBar } = useContext();
    const stateRef = useRef({}).current;
    const navigate = useNavigate();
    const toggleLike = async e => {
      e.preventDefault();
      e.stopPropagation();
      if (id) {
        const likedPost = post.likes[id];
        try {
          if (stateRef.isLiking) return;
          stateRef.isLiking = true;
          if (likedPost) delete post.likes[id];
          else post.likes[id] = true;
          handleAction("update", { id: post.id, likes: post.likes });
          await http.patch(
            `/${docType}s/${post.id}/${likedPost ? "dislike" : "like"}`
          );
          stateRef.isLiking = false;
          console.log("done liking...");
        } catch (message) {
          if (likedPost) post.likes[id] = true;
          else delete post.likes[id];
          handleAction("update", { id: post.id, likes: post.likes });
          stateRef.isLiking = false;
          setSnackBar(message);
        }
      } else setSnackBar();
    };

    const likeCount = Object.keys(post.likes || {}).length;

    // return (
    //   <div class="tweet">
    //     <div class="avatar">
    //       <img
    //         src="https://via.placeholder.com/50x50"
    //         alt="User profile picture"
    //       />
    //     </div>
    //     <div class="details">
    //       <div class="info">
    //         <span class="username">John Doe</span>
    //         <span class="handle">@johndoe</span>
    //         <span class="date">March 14, 2023</span>
    //       </div>
    //       <p class="content">
    //         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed luctus
    //         vestibulum velit, vel fermentum eros maximus sit amet.
    //       </p>
    //     </div>
    //   </div>
    // );
    const isOwner = post.user.id === id;
    const formatedDate = (() => {
      let str = moment(post.createdAt).fromNow();
      let digit = str.match(/\d+/g);
      digit = digit ? digit[0] : new Date(post.createdAt);
      if (str.indexOf("second") >= 0) {
        digit = digit.getSeconds ? digit.getSeconds() : digit;
        str = digit + "s";
      } else if (str.indexOf("hour") >= 0) {
        digit = digit.getHours ? digit.getHours() : digit;
        str = digit + "h";
      } else if (str.indexOf("minute") >= 0) {
        digit = digit.getMinutes ? digit.getMinutes() : digit;
        str = digit + "m";
      } else if (str.indexOf("day") >= 0) {
        digit = digit.getDate ? digit.getDate() : digit;
        str = digit + "d";
      } else if (str.indexOf("week") >= 0) {
        digit = digit.getDate ? Math.ceil(digit.getDate() / 7) : digit;
        str = digit + "w";
      } else if (str.indexOf("month") >= 0) {
        digit = digit.getMonth ? digit.getMonth() : digit;
        str = digit + "mth";
      } else if (str.indexOf("year") >= 0) {
        digit = digit.getFullYear ? digit.getFullYear() : digit;
        str = digit + "y";
      }
      return str;
    })();
    return (
      <>
        <WidgetContainer
          $plainWidget={plainWidget}
          onClick={
            readOnly
              ? undefined
              : e => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("post clicked...");
                  navigate(`/${docType}/${post.id}`);
                }
          }
          sx={{
            borderBottom: "1px solid #333",
            borderBottomColor: "divider",
            borderRadius: 0,
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            height: "auto",
            minHeight: "0",
            cursor: "pointer",
            backgroundColor: "transparent !important",
            "&:last-child": {
              // border: "1px solid red",
              // borderBottom: "none"
              // mb: 2
            },
            "&:first-of-type": {
              // borderTop: "1px solid red",
              // borderTopColor: "divider"
            },
            ...(showThread && {
              border: "none",
              borderRadius: "0",
              position: "relative",
              "&::before": {
                content: `""`,
                backgroundColor: "red",
                position: "absolute",
                // 100% - avatar size +  16px pd + 10px margin = net 5px spacing
                // considering bottom
                minHeight: `calc(100% - 50px)`,
                width: "1px",
                left: "36px", // half the avatar size
                bottom: "5px",
                zIndex: 1
              }
            }),
            mb,
            ...sx
          }}
          ref={ref}
        >
          <Avatar variant="sm" />
          <Box sx={{ width: "calc(100% - 40px)" }}>
            <Box
              sx={{
                position: "relative",
                display: "flex",
                // flexWrap: "wrap",
                "& > *": {
                  minWidth: "0"
                  // flex: 1
                }
              }}
            >
              <div
                style={{
                  display: "flex"
                  // maxWidth: "70%"
                }}
              >
                <StyledTypography
                  component="span"
                  $textEllipsis
                  variant="caption"
                  fontWeight="500"
                  color="text.secondaryMain"
                >
                  {isOwner
                    ? "You"
                    : post.user.displayName || post.user.username}
                </StyledTypography>
                {isOwner ? null : (
                  <StyledTypography
                    variant="caption"
                    $textEllipsis
                    color="common.main"
                    sx={{
                      ml: "3px"
                    }}
                    component="span"
                  >
                    @{post.user.username}
                  </StyledTypography>
                )}
              </div>
              <div style={{ display: "flex" }}>
                <StyledTypography
                  component="span"
                  sx={{
                    mx: "2px",
                    color: "common.main"
                  }}
                >
                  ·
                </StyledTypography>
                <StyledTypography
                  component="span"
                  variant="caption"
                  $textEllipsis={formatedDate.length > 7}
                  color="common.main"
                >
                  {formatedDate}
                </StyledTypography>
              </div>
            </Box>
            {caption ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  wordBreak: "break-word"
                }}
              >
                {caption}
              </Typography>
            ) : null}
            <Box
              sx={{
                my: 1,
                wordBreak: "break-word",
                color: "text.primary"
              }}
            >
              {post.text ? (
                <Typography variant="h5" sx={{ display: "inline" }}>
                  {post.text}
                </Typography>
              ) : null}
              {showAll && post.moreText ? (
                <Typography variant="h5" sx={{ display: "inline" }}>
                  {post.moreText}
                </Typography>
              ) : null}
              {post.moreText ? (
                readOnly ? (
                  <Typography component="span">...</Typography>
                ) : (
                  <StyledTypography
                    variant="link"
                    sx={{ ml: 1 }}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAll(!showAll);
                    }}
                  >
                    {showAll ? "Show less" : "Show more"}
                  </StyledTypography>
                )
              ) : null}
            </Box>
            {(post.medias ? (
              post.medias.length
            ) : (
              post.media
            )) ? (
              <Carousel medias={post.medias || [post.media]} to="/dd" />
            ) : null}
            {hideToolbox || readOnly ? null : (
              <Stack flexWrap="wrap">
                <Stack>
                  <Stack gap="4px">
                    <IconButton onClick={toggleLike}>
                      {post.likes[id] ? (
                        <FavoriteOutlinedIcon
                          sx={{
                            color: "common.heart"
                          }}
                        />
                      ) : (
                        <FavoriteBorderOutlinedIcon />
                      )}
                    </IconButton>
                    <Typography>{{}[likeCount] || likeCount}</Typography>
                  </Stack>
                  <Stack
                    gap="4px"
                    onClick={e => {
                      e.stopPropagation();
                      console.log("clicked...");
                      navigate(`?compose=comment`, {
                        state: {
                          post,
                          docType
                        }
                      });
                    }}
                  >
                    <IconButton>
                      <ChatBubbleOutlineOutlinedIcon />
                    </IconButton>
                    <Typography> {post.comments.length}</Typography>
                  </Stack>
                </Stack>
                <MoreActions
                  handleAction={handleAction}
                  composeDoc={post}
                  isOwner={isOwner}
                  isAuth={isAuth}
                  title={docType}
                  urls={{
                    delPath: `/${docType}s/${post.id}`
                  }}
                />
              </Stack>
            )}
          </Box>
        </WidgetContainer>
      </>
    );
  }
);

PostWidget.propTypes = {};

export default PostWidget;
