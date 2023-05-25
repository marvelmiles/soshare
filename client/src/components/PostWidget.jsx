import React, { useState } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  WidgetContainer,
  StyledTypography,
  StyledLink
} from "components/styled";
import { Stack, Avatar, Typography, Box, IconButton } from "@mui/material";
import MediaCarousel from "components/MediaCarousel";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import { useContext } from "context/store";
import { useNavigate } from "react-router-dom";
import MoreActions from "components/MoreActions";
import moment from "moment";
import useLikeDispatch from "hooks/useLikeDispatch";

const PostWidget = React.forwardRef(
  (
    {
      post = { text: "", medias: [], user: {}, likes: {}, comments: [] },
      handleAction,
      hideToolbox,
      showThread,
      docType = "post",
      caption,
      enableSnippet,
      plainWidget,
      sx,
      isRO,
      index,
      secondaryAction,
      searchParams,
      disableNavigation
    },
    ref
  ) => {
    const [showAll, setShowAll] = useState(false);
    const id = useSelector(state => (state.user.currentUser || {}).id);
    const navigate = useNavigate();
    const { handleLikeToggle } = useLikeDispatch({
      handleAction,
      docType,
      id: post.id,
      likes: post.likes
    });

    const { setSnackBar } = useContext();
    const likeCount = Object.keys(post.likes || {}).length;
    const isOwner = post.user.id === id;
    const formatedDate = (() => {
      let str = moment(post.createdAt).fromNow();
      let digit = str.match(/\d+/g);
      digit = digit ? digit[0] : new Date(post.createdAt);
      if (str.indexOf("second") >= 0) {
        digit = digit.getSeconds ? digit.getSeconds() : digit;
        if (digit > 10) str = digit + "s";
        else str = "now";
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
        {post.id}
        <WidgetContainer
          plainWidget={plainWidget}
          onClick={
            enableSnippet || disableNavigation
              ? undefined
              : e => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/${docType}s/${post.id}`);
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
            maxHeight: "none",
            cursor: disableNavigation ? "" : "pointer",
            backgroundColor: "transparent !important",
            mb: 0,
            pb: 1,
            ...(showThread && {
              border: "none",
              borderRadius: "0",
              position: "relative",
              mb: 0,
              pb: 0,
              "&::before": {
                content: `""`,
                backgroundColor: "primary.main",
                position: "absolute",
                top: "30px",
                // 100% - avatar size +  16px pt
                height: `calc(100% - 30px)`,
                width: "1px",
                transform: {
                  xs: "translateX(10px)",
                  s280: "translateX(15px)"
                }, // half the avatar size
                bottom: "0px"
                // zIndex: 1
              }
            }),
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
                "& > *": {
                  minWidth: "0"
                }
              }}
            >
              <div
                style={{
                  display: "flex"
                }}
              >
                <StyledLink
                  textEllipsis
                  variant="caption"
                  fontWeight="500"
                  sx={{ color: "text.primary", fontWeight: "500" }}
                  onClick={e => e.stopPropagation()}
                  to={`/u/${post.user.id}`}
                >
                  {isOwner
                    ? "You"
                    : post.user.displayName || post.user.username}
                </StyledLink>
                {isOwner ? null : (
                  <StyledTypography
                    variant="caption"
                    textEllipsis
                    color="primary.contrastText"
                    sx={{
                      ml: "3px",
                      fontWeight: "500"
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
                    color: "text.secondary"
                  }}
                >
                  ·
                </StyledTypography>
                <StyledTypography
                  component="span"
                  variant="caption"
                  textEllipsis={formatedDate.length > 7}
                  color="text.secondary"
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
                enableSnippet ? (
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
              <MediaCarousel medias={post.medias || [post.media]} />
            ) : null}
            {hideToolbox || enableSnippet ? null : (
              <Stack flexWrap="wrap">
                <Stack>
                  <Stack gap="4px">
                    <IconButton onClick={handleLikeToggle}>
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
                      if (id)
                        navigate(`?compose=comment`, {
                          state: {
                            composeDoc: post,
                            docType
                          }
                        });
                      else setSnackBar();
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
                  isRO={isRO}
                  title={docType}
                  urls={{
                    delPath: {
                      url: `/${docType}s`,
                      searchParams
                    }
                  }}
                  index={index}
                  docType={docType}
                />
              </Stack>
            )}
            <div style={{ paddingTop: "8px" }}>{secondaryAction}</div>
          </Box>
        </WidgetContainer>
      </>
    );
  }
);

PostWidget.propTypes = {};

export default PostWidget;
