import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  WidgetContainer,
  StyledTypography,
  StyledLink,
  avatarProfileSx
} from "components/styled";
import {
  Stack,
  Avatar,
  Typography,
  Box,
  IconButton,
  Tooltip
} from "@mui/material";
import MediaCarousel from "components/MediaCarousel";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import { useNavigate } from "react-router-dom";
import MoreActions from "components/MoreActions";
import moment from "moment";
import useLikeDispatch from "hooks/useLikeDispatch";
import { useLocation } from "react-router-dom";
import { createRelativeURL } from "api/http";
import UserTip from "tooltips/UserTip";

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
      plainWidget = showThread,
      sx,
      isRO,
      index,
      secondaryAction,
      searchParams,
      disableNavigation,
      dialogContent,
      maxWidth = "768px"
    },
    ref
  ) => {
    const [showAll, setShowAll] = useState(false);
    const cid = useSelector(state => state.user.currentUser.id);
    const navigate = useNavigate();
    const locState = useLocation().state;
    const [closePoppers, setClosePoppers] = useState(false);
    const stateRef = useRef({
      moreUrls: {
        delPath: {
          url: `/${docType}s`,
          searchParams
        }
      }
    });
    const inputTextRef = useRef();

    useEffect(() => {
      const textNode = inputTextRef.current;
      if (textNode) {
        textNode.style.height = "auto";
        textNode.style.height = textNode.scrollHeight + "px";
      }
      return () => setClosePoppers(true);
    }, [showAll]);

    const { handleLikeToggle } = useLikeDispatch({
      handleAction,
      docType,
      document: post
    });

    const likeCount = Object.keys(post.likes || {}).length;
    const isOwner = post.user.id === cid;

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

    const noNavigate = enableSnippet || disableNavigation;

    const userTip = (
      <UserTip key={post.user.id} user={post.user} isOwner={isOwner} />
    );

    return (
      <Box
        className="post-widget"
        sx={{
          position: "relative",
          width: "100%",
          "& > div": {
            borderBottom: "1px solid currentColor",
            borderBottomColor: "divider",
            borderRadius: 0,
            height: "auto",
            minHeight: 0,
            maxHeight: "none",
            backgroundColor: "transparent !important",
            mb: 0,
            ...(showThread
              ? {
                  borderBottom: "none",
                  borderRadius: "0"
                }
              : undefined),

            ".post-container": {
              display: "flex",
              gap: 1,
              alignItems: "flex-start",
              maxWidth,
              mx: "auto",
              cursor: noNavigate ? "default" : "pointer",

              ...(showThread
                ? {
                    position: "relative",
                    "&::before": {
                      content: `""`,
                      backgroundColor: "primary.main",
                      position: "absolute",
                      top: {
                        xs: "25px",
                        s280: "35px",
                        s360: "50px"
                      },
                      height: {
                        xs: "100%",
                        s280: "calc(100% - 8px)",
                        s360: "calc(100% - 22px)"
                      },
                      width: "1.8px",
                      borderRadius: "2px",
                      left: {
                        // half of avatar size
                        xs: "10px",
                        s280: "15px",
                        s360: "22px"
                      },
                      bottom: "0px"
                    }
                  }
                : undefined)
            }
          },
          ...sx
        }}
      >
        {dialogContent ? (
          <Typography
            component="div"
            className="custom-overlay"
            sx={{
              backgroundColor: "background.paper",
              color: "inherit"
            }}
          >
            {dialogContent}
          </Typography>
        ) : null}
        <WidgetContainer
          plainWidget={plainWidget}
          ref={ref}
          className="post-widget-container"
        >
          <div
            className="post-container"
            onClick={
              noNavigate
                ? undefined
                : e => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/${docType}s/${post.id}`);
                  }
            }
          >
            <Tooltip key={post.user.id} arrow={false} title={userTip}>
              <Avatar
                src={post.user.photoUrl}
                variant="md"
                sx={avatarProfileSx}
                // crossOrigin="anonymous"
              />
            </Tooltip>
            <Box
              sx={{
                width: "calc(100% - 52px)",
                maxWidth: {
                  xs: "calc(100% - 26px)",
                  s200: "calc(100% - 36px)",
                  s360: "calc(100% - 52px)"
                }
              }}
            >
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
                    <Tooltip key={post.user.id} arrow={false} title={userTip}>
                      {isOwner ? (
                        <span>You</span>
                      ) : (
                        <span>
                          {post.user.displayName || post.user.username}
                        </span>
                      )}
                    </Tooltip>
                  </StyledLink>
                  {isOwner ? null : (
                    <StyledTypography
                      variant="caption"
                      textEllipsis
                      color="text.secondary"
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

              {post.text ? (
                <Typography
                  ref={inputTextRef}
                  variant="h5"
                  component="div"
                  className="textarea-readOnly"
                  sx={{
                    mb: enableSnippet ? 0 : 1
                  }}
                >
                  <span>
                    {enableSnippet
                      ? post.text.slice(0, 80) +
                        (post.text.length >= 80 ? "..." : "")
                      : post.text}
                  </span>
                  <span>
                    {post.moreText && showAll && !enableSnippet
                      ? post.moreText
                      : null}
                  </span>
                </Typography>
              ) : null}

              {enableSnippet && (post.medias?.length || post.media) ? (
                <Typography>contains media file(s)...</Typography>
              ) : post.medias?.length || post.media ? (
                <MediaCarousel medias={post.medias || [post.media]} />
              ) : null}
              {hideToolbox || enableSnippet ? null : (
                <Stack flexWrap="wrap" sx={{ mt: 1 }}>
                  <Stack>
                    <Stack gap="4px">
                      <IconButton onClick={handleLikeToggle}>
                        {post.likes[cid] ? (
                          <FavoriteOutlinedIcon
                            sx={{
                              color: "common.heart"
                            }}
                          />
                        ) : (
                          <FavoriteBorderOutlinedIcon />
                        )}
                      </IconButton>
                      <Typography>{likeCount}</Typography>
                    </Stack>
                    <Stack
                      gap="4px"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(
                          createRelativeURL("compose", `compose=comment`),
                          {
                            state: {
                              ...locState,
                              document: post,
                              docType,
                              reason: "comment"
                            },
                            replace: true
                          }
                        );
                      }}
                    >
                      <IconButton>
                        <ChatBubbleOutlineOutlinedIcon />
                      </IconButton>
                      <Typography> {post.comments.length}</Typography>
                    </Stack>
                  </Stack>
                  <MoreActions
                    close={closePoppers}
                    handleAction={handleAction}
                    document={post}
                    isOwner={isOwner}
                    isRO={isRO}
                    title={docType}
                    urls={stateRef.current.moreUrls}
                    index={index}
                    docType={docType}
                  />
                </Stack>
              )}
              {secondaryAction ? (
                <div style={{ paddingTop: "8px" }}>{secondaryAction}</div>
              ) : null}
            </Box>
          </div>
        </WidgetContainer>
      </Box>
    );
  }
);

PostWidget.propTypes = {};

export default PostWidget;
