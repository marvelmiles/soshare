import React, { useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import PostWidget from "components/PostWidget";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import { WidgetContainer } from "components/styled";
import EmptyData from "components/EmptyData";
import { Typography } from "@mui/material";
import InfiniteScroll from "components/InfiniteScroll";
import { contextHandler } from "utils";

const PostsView = ({
  plainWidget = true,
  title,
  url,
  sx,
  postSx,
  children,
  centerEmptyText,
  scrollNodeRef,
  infiniteScrollProps,
  privateView
}) => {
  const { socket, composeDoc, setComposeDoc } = useContext();
  const currentUser = useSelector(state => state.user.currentUser || {});
  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    url: url || "/posts",
    cachedData: {},
    registeredIds: {}
  });
  const _handleAction = useCallback(() => {}, []);
  useEffect(() => {
    socket.on("post", post => {
      _handleAction("new", { document: post, cid: currentUser?.id });
    });
    socket.on("update-post", post => {
      _handleAction("update", { document: post });
    });
    socket.on("filter-post", ({ id }) => {
      _handleAction("filter", { document: id });
    });
  }, [socket, currentUser, _handleAction]);

  useEffect(() => {
    if (composeDoc) {
      switch (composeDoc.action) {
        case "filter":
        case "clear-cache":
          _handleAction(
            composeDoc.action,
            composeDoc.document.id,
            composeDoc.document.user.id
          );
          break;
        case "new":
          if (composeDoc.docType === "post")
            _handleAction("new", composeDoc.document);
        default:
          break;
      }
    }
  }, [composeDoc, _handleAction, setComposeDoc]);

  return (
    <InfiniteScroll
      root={document.documentElement}
      Component={WidgetContainer}
      componentProps={{
        plainWidget,
        sx: sx
      }}
      url={stateRef.current.url}
      ref={infiniteScrollRef}
      notifierDelay={
        composeDoc?.document?.user?.id === currentUser?.id ? -1 : undefined
      }
      scrollNodeRef={scrollNodeRef}
      {...infiniteScrollProps}
      handleAction={_handleAction}
      key={"infinite-posts"}
      withCredentials={!!currentUser.id}
    >
      {({ data: { data, paging }, setObservedNode, dataChanged }) => {
        return paging?.nextCursor !== undefined || data.length ? (
          <>
            {title && (
              <Typography variant="h5" fontWeight="bold" mb={2}>
                {title}
              </Typography>
            )}
            {children}
            {data.length ? (
              data.map((post, i) =>
                post.user ? (
                  <PostWidget
                    post={post}
                    maxHeight="none"
                    handleAction={_handleAction}
                    key={i}
                    ref={
                      dataChanged && i === data.length - 1
                        ? node => node && setObservedNode(node)
                        : undefined
                    }
                    sx={postSx}
                    index={i}
                  />
                ) : null
              )
            ) : (
              <EmptyData
                centerEmptyText={centerEmptyText}
                sx={{
                  minHeight: "calc(80vh -  202px)",
                  height: "normal"
                }}
                label={
                  privateView
                    ? `You don't have any post at the moment!`
                    : `We're sorry it seems there is no posts at the moment`
                }
              />
            )}
          </>
        ) : (
          <EmptyData
            centerEmptyText={centerEmptyText}
            label={
              privateView
                ? `You don't have any post at the moment!`
                : `We're sorry it seems there is no posts at the moment`
            }
          />
        );
      }}
    </InfiniteScroll>
  );
};

PostsView.propTypes = {};

export default PostsView;
