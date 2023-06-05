import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import PostWidget from "components/PostWidget";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import { WidgetContainer } from "components/styled";
import EmptyData from "components/EmptyData";
import { Typography } from "@mui/material";
import InfiniteScroll from "components/InfiniteScroll";
import useCallbacks from "hooks/useCallbacks";

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
    url: url || "/posts"
  });
  const { _handleAction } = useCallbacks(infiniteScrollRef, {
    currentUser,
    stateCtx: stateRef.current
  });
  useEffect(() => {
    const handleFilter = ({ id }) => {
      _handleAction("filter", { document: id, cacheData: false });
    };

    const handleAppend = post => {
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
  }, [socket, _handleAction]);

  useEffect(() => {
    if (composeDoc) {
      switch (composeDoc.reason) {
        case "filter":
        case "clear-cache":
          _handleAction(composeDoc.reason, composeDoc);
          break;
        case "new":
          if (composeDoc.docType === "post")
            _handleAction("new", { document: composeDoc.document });
          break;
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
        !currentUser.id ||
        (composeDoc && currentUser.id !== composeDoc.document.user?.id)
          ? undefined
          : -1
      }
      scrollNodeRef={scrollNodeRef}
      {...infiniteScrollProps}
      handleAction={_handleAction}
      key={"infinite-posts"}
      withCredentials={!!currentUser.id}
    >
      {({ data: { data, paging }, setObservedNode, dataChanged }) => {
        // console.log(data.length);
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
                      dataChanged && i === data.length - 1
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