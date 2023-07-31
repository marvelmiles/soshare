import React, { useEffect, useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "components/styled";
import EmptyData from "components/EmptyData";
import { Typography, Stack } from "@mui/material";
import Person from "components/Person";
import { useContext } from "context/store";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import InfiniteScroll from "components/InfiniteScroll";
import useFollowDispatch from "hooks/useFollowDispatch";
import useCallbacks from "hooks/useCallbacks";
import { addToSet } from "utils";

const FollowMeView = ({
  title = "",
  url = "suggest",
  searchParams,
  priority = "toggle",
  secondaryTitle,
  variant = "block",
  infiniteScrollProps,
  widgetProps,
  emptyLabel,
  privateUid
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
  const { _handleAction } = useCallbacks(infiniteScrollRef, currentUser);
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

  const { handleToggleFollow, isProcessingFollow } = useFollowDispatch({
    priority
  });

  const handleFollowingAction = useCallback(
    (toFollow, skipDelete) => {
      return ({ to, from }) => {
        const isFrm = from.id === userId;
        const isTo = to.id === userId;
        const key = (toFollow ? "followId" : "unfollowId") + to.id + from.id;

        console.log(toFollow, isTo, isFrm, userId, " socket...");

        if (isTo || isFrm) {
          console.log(" in socket... ");
          if (
            stateRef.current[key] ||
            (!skipDelete && (isFrm && isCurrentUser))
          ) {
            delete stateRef.current[key];
            return;
          }
          console.log(" done socket... ");
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
          if (!skipDelete) delete stateRef.current[key];
        }
      };
    },
    [_handleAction, priority, userId, isCurrentUser]
  );

  useEffect(() => {
    if (socket) {
      const isSuggest = priority === "follow";

      let hasSuggested;
      const suggestFollowers = data => {
        if (!hasSuggested) {
          hasSuggested = true;
          infiniteScrollRef.current.setData({
            ...data,
            data: addToSet([
              ...data.data,
              ...infiniteScrollRef.current.data.data
            ])
          });
          hasSuggested = undefined;
        }
      };

      let hasUser;
      const handleUserEntrying = user => {
        if (!hasUser) {
          hasUser = true;
          socket.emit("suggest-followers", user);
          infiniteScrollRef.current.setData({
            ...infiniteScrollRef.current.data,
            data: addToSet([user, ...infiniteScrollRef.current.data.data])
          });
          hasUser = undefined;
        }
      };

      const handleFollow = handleFollowingAction(true);
      const handleUnfollow = handleFollowingAction();

      const handleUpdateUser = (user, isProfile) =>
        isProfile && _handleAction("update", { document: user });

      socket.on("unfollow", handleUnfollow);
      socket.on("follow", handleFollow);
      if (isSuggest) {
        socket.on("suggest-followers", suggestFollowers);
        socket.on("user", handleUserEntrying);
      }
      socket.on("update-user", handleUpdateUser);
      return () => {
        if (isSuggest) {
          socket
            .emit("disconnect-suggest-followers-task")
            .removeEventListener("suggest-followers", suggestFollowers)
            .removeEventListener("user", handleUserEntrying);
        }
        socket
          .removeEventListener("follow", handleFollow)
          .removeEventListener("unfollow", handleUnfollow)
          .removeEventListener("update-user", handleUpdateUser);
      };
    }
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
    if (user)
      handleFollowingAction(!user.isFollowing, true)({
        to: user,
        from: currentUser
      });
  }, [handleFollowingAction, previewUser?.followUser, currentUser]);
  const loading = dataSize === undefined || dataSize < 0;

  return (
    <WidgetContainer
      ref={scrollNodeRef}
      className="widget-container"
      sx={{ position: "relative", p: 0 }}
      {...widgetProps}
      key={`follome-widget-${priority}-${privateUid}`}
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
        // shallowLoading={loading}
        key={`follome-widget-${priority}-${privateUid}`}
        ref={infiniteScrollRef}
        sx={{
          px: 2
        }}
        url={stateRef.current.url}
        searchParams={searchParams}
        {...infiniteScrollProps}
        withCredentials={!!currentUser.id}
        notifierDelay={
          isCurrentUser ? (priority === "toggle" ? undefined : -1) : undefined
        }
        scrollNodeRef={scrollNodeRef}
        handleAction={_handlerAction}
      >
        {({ data: { data, loading } }) => {
          const renderPersons = () => {
            return data.map((u = {}, i) => {
              const isFollowing = {
                toggle: currentUser.following.includes(u.id),
                follow: false,
                unfollow: true
              }[isCurrentUser ? priority : "toggle"];

              return (
                <Person
                  variant={variant}
                  key={i + u.id + priority}
                  sx={
                    variant !== "block" || currentUser.following
                      ? undefined
                      : {
                          minHeight: "100px"
                        }
                  }
                  user={u}
                  btnLabel={isFollowing ? "Unfollow" : "Follow"}
                  onBtnClick={() =>
                    handleToggleFollow(undefined, u, isFollowing)
                  }
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
                    emptyLabel ||
                    {
                      toggle: isCurrentUser
                        ? "You don't have any followers"
                        : `Followers list is currently empty.`,
                      unfollow: isCurrentUser
                        ? "Your following list is currently empty. Start following other users to see their updates!"
                        : `Following list appears to be empty at the moment!`,
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

FollowMeView.propTypes = {};

export default FollowMeView;