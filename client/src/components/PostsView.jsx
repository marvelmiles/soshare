import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import PostWidget from "./PostWidget";
import http from "api/http";
import { useContext } from "redux/store";
import { useSelector } from "react-redux";
import { WidgetContainer } from "./styled";
import { Typography } from "@mui/material";
import useInfiniteScroll from "hooks/useInfiniteScroll";
import InfiniteScroll from "./InfiniteScroll";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import InputBox from "components/InputBox";
import IconButton from "@mui/material/IconButton";
import moment from "moment";
import { useLocation, useSearchParams } from "react-router-dom";
import ThreadCard from "./comments/ThreadCard";
import Compose from "pages/Compose";
import Stack from "@mui/material/Stack";
import { isOverflowing } from "utils";
const PostsView = ({
  index,
  plainWidget = true,
  minHeight,
  title,
  rootRef,
  hideDataNotifier,
  infiniteScrollProps,
  url,
  sx,
  postSx,
  children,
  centerEmptyText
}) => {
  const { socket, composeDoc } = useContext();
  const { currentUser } = useSelector(state => state.user);
  const infiniteScrollRef = useRef();
  const stateRef = useRef({ url: url || "/posts" });
  const { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef();
  const _handleAction = useCallback((reason, post, _uid) => {
    const { setData } = infiniteScrollRef.current;
    let length;
    switch (reason) {
      case "new":
        setData(prev => {
          if (!length) length = prev.data.length + 1;
          if (prev.data.length >= length) return prev;
          prev.data = [post, ...prev.data];
          return { ...prev };
        }, post.length || 1);
        break;
      case "filter":
        setData(prev => {
          if (!length) length = prev.data.length - 1;
          if (prev.data.length <= length) return prev;
          prev.data = prev.data.filter(({ id, user: { id: uid } }) =>
            _uid === uid ? false : id !== post
          );
          return { ...prev };
        });
        break;
      default:
        setData(prev => {
          prev.data = prev.data.map(p =>
            p.id === post.id ? { ...p, ...post } : p
          );
          return { ...prev };
        });
        break;
    }
  }, []);
  useEffect(() => {
    socket.on("feed-post", post => {
      if (socket.postId === post.id) return;
      socket.postId = post.id;
      console.log("socket feed once...", post.visibility);
      switch (post.visibility) {
        case "everyone":
          _handleAction("new", post);
          break;
        case "followers":
          if (currentUser.following.includes(post.user.id)) {
            _handleAction("new", post);
          }
          break;
        case "following":
          if (currentUser.followers.includes(post.user.id)) {
            _handleAction("new", post);
          }
          break;
        default:
          post.user.id === currentUser.id && _handleAction("new", post);
          break;
      }
    });
    socket.on("update-feed-post", post => {
      console.log("called once...");
      switch (post.visibility) {
        case "everyone":
          _handleAction("update", post);
          break;
        case "followers":
          if (currentUser.following.includes(post.user.id)) {
            _handleAction("update", post);
          }
          break;
        case "following":
          if (currentUser.followers.includes(post.user.id)) {
            _handleAction("update", post);
          }
          break;
        default:
          post.user.id === currentUser.id && _handleAction("update", post);
          break;
      }
    });
    socket.on("filter-post", id => {
      console.log("filter post...");
      _handleAction("filter", id);
    });

    const timer = setInterval(() => {
      infiniteScrollRef.current?.setData(prev => ({
        ...prev
      }));
    }, 1000);
    return () => {
      delete socket.postId;
      clearInterval(timer);
    };
  }, [socket, currentUser, _handleAction]);

  useEffect(() => {
    if (composeDoc?.docType === "post")
      _handleAction("update", composeDoc.document);
  }, [composeDoc, _handleAction]);
  return (
    <>
      <InfiniteScroll
        hideDataNotifier={hideDataNotifier}
        root={document.documentElement}
        Component={WidgetContainer}
        componentProps={{
          $plainWidget: plainWidget,
          sx: sx
        }}
        url={stateRef.current.url}
        // {...infiniteScrollProps}
        ref={infiniteScrollRef}
        // defaultData={{
        //   data: Array.from(new Array(30)),
        //   paging: {}
        // }}
      >
        {({ setObservedNode, data: { data } }) => {
          // title = "ssssssssssssss";
          return data.length ? (
            <>
              {title && (
                <Typography variant="h5" fontWeight="bold" mb={2}>
                  {title}
                </Typography>
              )}
              {children}
              {data.map((post, i) => (
                <>
                  <PostWidget
                    post={post}
                    maxHeight="none"
                    handleAction={_handleAction}
                    key={i}
                    ref={
                      i === data.length - (data.length > 4 ? 3 : 1)
                        ? node => node && setObservedNode(node)
                        : null
                    }
                    sx={postSx}
                  />
                </>
              ))}
            </>
          ) : (
            <Stack
              sx={
                centerEmptyText && {
                  height: "inherit",
                  width: "inherit",
                  minHeight: "inherit",
                  minWidth: "inherit", 
                }
              }
            >
              <Typography color="common.dark" textAlign="center">
                We're sorry, but there doesn't seem to be any data available at
                the moment.
              </Typography>
            </Stack>
          
            );
        }}
      </InfiniteScroll>
      <Compose
        openFor={{
          comment: true
        }}
      />
    </>
  );
};

PostsView.propTypes = {};

export default PostsView;
