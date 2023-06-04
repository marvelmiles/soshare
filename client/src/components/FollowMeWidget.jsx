import React, { useEffect, useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "components/styled";
import EmptyData from "components/EmptyData";
import { Typography, Stack } from "@mui/material";
import Person from "./Person";
import { useContext } from "context/store";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import InfiniteScroll from "components/InfiniteScroll";
import useFollowDispatch from "hooks/useFollowDispatch";
import Box from "@mui/material/Box";
import useCallbacks from "hooks/useCallbacks";

const FollowMeWidget = ({
  title = "",
  url = "suggest",
  searchParams,
  priority = "follow",
  secondaryTitle,
  variant = "block",
  infiniteScrollProps,
  userFollowing,
  widgetProps,
  emptyDataMessage
}) => {
  const { previewUser, currentUser = {} } = useSelector(state => state.user);
  let { userId } = useParams();
  const [dataSize, setDataSize] = useState();
  const isCurrentUser = currentUser.id === userId;
  const { socket } = useContext();
  const dispatch = useDispatch();
  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    toggle: {},
    follow: {},
    unfollow: {},
    priority,
    url:
      {
        suggest: `/users/${userId}/suggest-followers`,
        followers: `/users/${userId}/followers`,
        following: `/users/${userId}/following`
      }[url] || url
  });
  const { _handleAction } = useCallbacks(infiniteScrollRef, {
    currentUser,
    stateCtx: stateRef.current
  });
  const scrollNodeRef = useRef();
  const _handlerAction = useCallback(
    (reason, res) => {
      switch (reason) {
        case "data":
          setDataSize(res.dataSize);
          break;
        default:
          _handleAction(reason, res);
          break;
      }
    },
    [_handleAction]
  );

  const { following, toggleFollow, isProcessingFollow } = useFollowDispatch(
    undefined,
    priority,
    currentUser.following || userFollowing
  );
  // useEffect(() => {
  //   const user = previewUser?.followUser;
  //   if (user && user.id === userId) {
  //     if (user.filter) {
  //       if (priority !== "toggle") {
  //         if (priority === user.priority)
  //           _handlerAction("new", { document: user });
  //         else _handlerAction("filter", { document: user });
  //       }
  //     } else {
  //       priority !== "toggle" && _handlerAction("filter", { document: user });
  //       if (user.isFollowing)
  //         priority === "follow" && _handlerAction("new", { document: user });
  //       else {
  //         (user.priority ===
  //           {
  //             follow: "unfollow",
  //             unfollow: "follow"
  //           }[priority] ||
  //           (user.priority === "toggle" && priority === "unfollow")) &&
  //           _handlerAction("new", { document: user });
  //       }
  //     }
  //     stateRef.current[priority].followId = user.id + userId;
  //     stateRef.current[priority].unfollowId = user.id + userId;
  //   }
  // }, [previewUser?.followUser, _handlerAction, priority, userId]);

  useEffect(() => {
    const toggleFollowing = toFollow => ({ to, from }) => {
      const isFrm = from.id === userId;
      const isTo = to.id === userId;
      const key = (toFollow ? "followId" : "unfollowId") + to.id + from.id;
      if (isTo || isFrm) {
        if (stateRef.current[key]) return;
        stateRef.current[key] = true;
        if (isTo && priority === "toggle")
          _handlerAction(toFollow ? "new" : "filter", { document: from });
        else if (isFrm) {
          if (priority === "unfollow")
            _handlerAction(toFollow ? "new" : "filter", { document: to });
          else if (priority === "follow")
            _handlerAction(toFollow ? "filter" : "new", { document: to });
          else _handlerAction("update", { document: to });
        }
        stateRef.current[
          (toFollow ? "unfollowId" : "followId") + to.id + from.id
        ] = undefined;
      }
    };

    const suggestFollowers = data => {
      if (priority === "follow" && !stateRef.current[priority]) {
        stateRef.current[priority] = true;
        infiniteScrollRef.current.setData({
          ...data,
          data: infiniteScrollRef.current.data.data.concat(data.data)
        });
        stateRef.current[priority] = undefined;
      }
    };

    const handleFollow = toggleFollowing(true);
    const handleUnfollow = toggleFollowing();

    socket.on("unfollow", handleUnfollow);
    socket.on("follow", handleFollow);
    socket.on("suggest-followers", suggestFollowers);

    return () => {
      socket.removeEventListener("suggest-followers", suggestFollowers);
      socket.removeEventListener("follow", handleFollow);
      socket.removeEventListener("unfollow", handleUnfollow);
    };
  }, [socket, dispatch, _handlerAction, userId, priority, isCurrentUser]);

  return (
    <WidgetContainer
      ref={scrollNodeRef}
      className="widget-container"
      sx={{ position: "relative", p: 0 }}
      {...widgetProps}
    >
      {dataSize >= 0 ? (
        <>
          {title || secondaryTitle ? (
            <div
              id="ddddddddddd"
              style={{
                marginBottom: "16px",
                position: "sticky",
                top: 0,
                left: 0,
                backgroundColor: "inherit",
                zIndex: 1000,
                padding: "16px",
                paddingBottom: "4px"
              }}
            >
              <Typography variant="h5" fontWeight="bold">
                {title}
              </Typography>
              {secondaryTitle ? dataSize + " " + secondaryTitle : null}
            </div>
          ) : null}
        </>
      ) : null}
      <InfiniteScroll
        key={"follome-widget-" + priority}
        ref={infiniteScrollRef}
        sx={{
          px: 2,
          ".data-scrollable-content": {
            marginTop: dataSize ? "0px" : "-50px"
          }
        }}
        url={stateRef.current.url}
        fullHeight={false}
        searchParams={searchParams}
        {...infiniteScrollProps}
        withCredentials={!!(currentUser.id || following)}
        verify={priority === "toggle"}
        notifierDelay={
          isCurrentUser ? (priority === "toggle" ? undefined : -1) : undefined
        }
        scrollNodeRef={scrollNodeRef}
        handleAction={_handlerAction}
      >
        {({ data: { data }, setObservedNode }) => {
          const renderPersons = () => {
            return data.map((u = {}, i) => {
              const isFollowing = {
                toggle: following && following.includes(u.id),
                follow: false,
                unfollow: true
              }[userId === currentUser.id ? priority : "toggle"];

              return (
                <Person
                  ref={
                    i === data.length - 1
                      ? node => setObservedNode(node)
                      : undefined
                  }
                  variant={variant}
                  key={i + u.id + priority}
                  sx={
                    variant !== "block" || following
                      ? undefined
                      : {
                          minHeight: "100px"
                        }
                  }
                  user={u}
                  btnLabel={
                    following ? (isFollowing ? "Unfollow" : "Follow") : "Follow"
                  }
                  onBtnClick={e => toggleFollow(e, u, isFollowing)}
                  disabled={isProcessingFollow}
                  isOwner={currentUser.id ? u.id === currentUser.id : false}
                />
              );
            });
          };
          return (
            <div>
              {data.length ? (
                variant === "block" ? (
                  <Stack flexWrap="wrap" justifyContent="normal" gap={2} p={2}>
                    {renderPersons()}
                  </Stack>
                ) : (
                  renderPersons()
                )
              ) : (
                <EmptyData
                  label={
                    emptyDataMessage ||
                    {
                      toggle: isCurrentUser
                        ? "You don't have any followers"
                        : `Followers list is currently empty.`,
                      unfollow: isCurrentUser
                        ? "Your following list is currently empty. Start following other users to see their updates"
                        : `Following list appears to be empty at this time.`,
                      follow:
                        "We're sorry it seems there is no one to follow at the moment"
                    }[priority]
                  }
                />
              )}
            </div>
          );
        }}
      </InfiniteScroll>
    </WidgetContainer>
  );
};

FollowMeWidget.propTypes = {};

export default FollowMeWidget;
