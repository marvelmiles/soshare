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
import useCallbacks from "hooks/useCallbacks";

const FollowMeWidget = ({
  title = "",
  url = "suggest",
  searchParams,
  priority = "toggle",
  secondaryTitle,
  variant = "block",
  infiniteScrollProps,
  widgetProps,
  emptyDataMessage,
  privateUid,
  privateUserFollowing
}) => {
  const { previewUser, currentUser = {} } = useSelector(state => state.user);
  let { userId } = useParams();
  userId = userId || currentUser.id;
  const [dataSize, setDataSize] = useState(-1);
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

  const { following, toggleFollow, isProcessingFollow } = useFollowDispatch({
    priority,
    following: privateUserFollowing
  });

  const handleFollowingAction = useCallback(
    toFollow => ({ to, from = { id: currentUser.id } }) => {
      const isFrm = from.id === userId;
      const isTo = to.id === userId;
      console.log(from.id, userId, to.id, isFrm, isTo);
      const key = (toFollow ? "followId" : "unfollowId") + to.id + from.id;
      if (isTo || isFrm) {
        if (stateRef.current[key]) return;
        stateRef.current[key] = true;

        if (isTo && priority === "toggle") {
          _handleAction(toFollow ? "new" : "filter", { document: from });
        } else if (isFrm) {
          if (priority === "unfollow")
            _handleAction(toFollow ? "new" : "filter", { document: to });
          else if (priority === "follow")
            _handleAction(toFollow ? "filter" : "new", { document: to });
          else _handleAction("update", { document: to });
        }
        stateRef.current[
          (toFollow ? "unfollowId" : "followId") + to.id + from.id
        ] = undefined;
      } else {
        console.log(isTo, isFrm, " not a memeber ");
      }
    },
    [_handleAction, priority, userId, currentUser.id]
  );

  useEffect(() => {
    const isSuggest = priority === "follow";

    const suggestFollowers = data => {
      if (!stateRef.current[priority]) {
        stateRef.current[priority] = true;
        infiniteScrollRef.current.setData({
          ...data,
          data: infiniteScrollRef.current.data.data.concat(data.data)
        });
        stateRef.current[priority] = undefined;
      }
    };

    const handleFollow = handleFollowingAction(true);
    const handleUnfollow = handleFollowingAction();
    const handleUpdateUser = (user, isProfile) =>
      isProfile && _handleAction("update", user);

    socket.on("unfollow", handleUnfollow);
    socket.on("follow", handleFollow);
    isSuggest && socket.on("suggest-followers", suggestFollowers);
    socket.on("update-user", handleUpdateUser);
    return () => {
      if (isSuggest) {
        socket.emit("disconnect-suggest-followers-task");
        socket.removeEventListener("suggest-followers", suggestFollowers);
      }
      socket
        .removeEventListener("follow", handleFollow)
        .removeEventListener("unfollow", handleUnfollow)
        .removeEventListener("update-user", handleUpdateUser);
    };
  }, [
    socket,
    dispatch,
    userId,
    priority,
    isCurrentUser,
    handleFollowingAction,
    _handleAction
  ]);

  useEffect(() => {
    const user = previewUser?.followUser;
    if (user) handleFollowingAction(!user.isFollowing)({ to: user });
  }, [handleFollowingAction, previewUser?.followUser]);
  const loading = dataSize === undefined || dataSize < 0;

  return (
    <WidgetContainer
      ref={scrollNodeRef}
      className="widget-container"
      sx={{ position: "relative", p: 0 }}
      {...widgetProps}
    >
      {loading ? null : (
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
      )}
      <InfiniteScroll
        shallowLoading={loading}
        key={"follome-widget-" + priority}
        ref={infiniteScrollRef}
        sx={{
          px: 2
        }}
        url={stateRef.current.url}
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
                  isOwner={
                    currentUser.id ? u.id === currentUser.id : u.id === userId
                  }
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
                      toggle:
                        isCurrentUser || privateUid
                          ? "You don't have any followers"
                          : `Followers list is currently empty.`,
                      unfollow:
                        isCurrentUser || privateUid
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
