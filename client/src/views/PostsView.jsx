import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import PostWidget from "components/PostWidget";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import EmptyData from "components/EmptyData";
import { Typography } from "@mui/material";
import InfiniteScroll from "components/InfiniteScroll";
import useCallbacks from "hooks/useCallbacks";
import { filterDocsByUserSet } from "utils";

const PostsView = ({
  title,
  url,
  sx,
  postSx,
  children,
  scrollNodeRef,
  infiniteScrollProps,
  privateUid
}) => {
  const {
    socket,
    context: { composeDoc, blacklistedPosts, blacklistedUsers }
  } = useContext();
  const currentUser = useSelector(state => state.user.currentUser || {});
  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    url: url || "/posts"
  });
  const { _handleAction } = useCallbacks(infiniteScrollRef, {
    currentUser,
    stateCtx: stateRef.current
  });
  useEffect(() => {
    if (socket) {
      const handleFilter = ({ id }) => {
        _handleAction("filter", { document: id, cacheData: false });
      };

      const handleAppend = post => {
        (privateUid ? post.user.id === privateUid : true) &&
          _handleAction("new", { document: post });
      };

      const handleUpdate = post => {
        _handleAction("update", { document: post });
      };

      socket.on("post", handleAppend);
      socket.on("update-post", handleUpdate);
      socket.on("filter-post", handleFilter);

      return () => {
        socket.removeEventListener("filter-post", handleFilter);
        socket.removeEventListener("post", handleAppend);
        socket.removeEventListener("update-post", handleUpdate);
      };
    }
  }, [socket, _handleAction, privateUid]);

  useEffect(() => {
    if (composeDoc && composeDoc.docType === "post") {
      switch (composeDoc.reason) {
        case "new":
          _handleAction("new", { document: composeDoc.document });
          break;
        case "request":
          _handleAction("update", composeDoc.document);
          break;
        default:
          break;
      }
    }
  }, [composeDoc, _handleAction]);

  useEffect(() => {
    filterDocsByUserSet(infiniteScrollRef.current, blacklistedUsers);
  }, [blacklistedUsers]);

  return (
    <InfiniteScroll
      exclude={Object.keys(blacklistedPosts).join(",")}
      root={document.documentElement}
      sx={sx}
      url={stateRef.current.url}
      ref={infiniteScrollRef}
      notifierDelay={
        !currentUser.id || currentUser.id !== composeDoc?.document?.user?.id
          ? undefined
          : -1
      }
      scrollNodeRef={scrollNodeRef}
      {...infiniteScrollProps}
      key={"infinite-posts"}
      withCredentials={!!currentUser.id}
      readyState={
        composeDoc?.done === false ? "pending" : infiniteScrollProps?.readyState
      }
      searchId={
        composeDoc?.docType === "post"
          ? composeDoc.url
            ? composeDoc.url && composeDoc.document.id
            : undefined
          : undefined
      }
    >
      {({ data: { data, paging }, setObservedNode }) => {
        return paging?.nextCursor !== undefined || data.length ? (
          <>
            {title && (
              <Typography variant="h5" fontWeight="bold" mb={2}>
                {title}
              </Typography>
            )}
            {children}
            {data.length ? (
              data.map((post, i) => {
                return post.user ? (
                  <PostWidget
                    post={post}
                    maxHeight="none"
                    handleAction={_handleAction}
                    key={i}
                    ref={
                      i === data.length - 1
                        ? node => node && setObservedNode(node)
                        : undefined
                    }
                    sx={postSx}
                    index={i}
                  />
                ) : null;
              })
            ) : (
              <EmptyData
                label={
                  privateUid
                    ? `You don't have any post at the moment!`
                    : `We're sorry it seems there is no posts at the moment`
                }
              />
            )}
          </>
        ) : (
          <EmptyData
            label={
              privateUid
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
