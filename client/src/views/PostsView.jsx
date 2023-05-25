import React, { useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import PostWidget from "components/PostWidget";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import { WidgetContainer } from "components/styled";
import EmptyData from "components/EmptyData";
import { Typography } from "@mui/material";
import InfiniteScroll from "components/InfiniteScroll";
import { checkVisibility } from "utils/validators";
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
  const _handleAction = useCallback(
    (reason, post, _uid, cacheData = true) => {
      const { setData, data } = infiniteScrollRef.current;
      switch (reason) {
        case "new":
          if (stateRef.current.registeredIds[post]) return;
          stateRef.current.registeredIds[post] = post;
          const cache = stateRef.current.cachedData[post];
          if (stateRef.current.cachedData[post]) {
            data.data.splice(cache.index, 0, cache.data);
          } else {
            data.data = [post, ...data.data];
          }
          setData(
            {
              ...data
            },
            cache || post.user?.id === currentUser.id ? undefined : 1
          );
          break;
        case "filter":
          setData({
            ...data,
            data: data.data.filter((p, i) => {
              if (_uid === p.user.id || p.id === post) {
                delete stateRef.current.registeredIds[post];
                if (cacheData)
                  stateRef.current.cachedData[post] = {
                    index: i,
                    data: p
                  };
                return false;
              }
              return true;
            })
          });
          break;
        case "clear-cache":
          delete stateRef.current.cachedData[post];
          delete stateRef.current.registeredIds[post];
          break;
        case "update":
          setData({
            ...data,
            data: data.data.map(p => (p.id === post.id ? { ...p, ...post } : p))
          });
          break;
        default:
          break;
      }
    },
    [currentUser.id]
  );
  useEffect(() => {
    socket.on("post", post => {
      if (!checkVisibility(post, currentUser)) return;
      _handleAction("new", post);
    });
    socket.on("update-post", post => {
      _handleAction("update", post);
    });
    socket.on("filter-post", id => {
      _handleAction("filter", id);
    });
  }, [socket, currentUser, _handleAction]);

  useEffect(() => {
    if (composeDoc) {
      switch (composeDoc.reason) {
        case "blacklisted-user":
          _handleAction(composeDoc.action, composeDoc.id, composeDoc.user.id);
          break;
        default:
          if (composeDoc.docType === "post" && composeDoc.document)
            _handleAction("update", composeDoc.document);
          break;
      }
    }
    return () => {
      if (composeDoc?.docType === "post") setComposeDoc(undefined);
    };
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
      notifierDelay={composeDoc?.user.id === currentUser.id ? -1 : undefined}
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
