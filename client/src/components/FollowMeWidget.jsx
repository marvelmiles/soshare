import React, { useEffect, useCallback, useRef } from "react";
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
import { addToSet } from "utils";

const FollowMeWidget = ({
  title = "",
  url = "suggest",
  searchParams,
  priority = "toggle",
  secondaryTitle,
  variant = "block",
  infiniteScrollProps,
  userFollowing
}) => {
  const { previewUser, currentUser = {} } = useSelector(state => state.user);
  const { id: cid, following: _following } = currentUser;
  let { userId } = useParams();
  const isCurrentUser = cid === userId;
  const { socket } = useContext();
  const dispatch = useDispatch();
  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    toggle: {},
    follow: {},
    unfollow: {},
    priority
  });
  const handleAction = useCallback((reason, socketUser) => {
    const { setData, data } = infiniteScrollRef.current;
    switch (reason) {
      case "new":
        setData({
          ...data,
          data: addToSet(data.data, socketUser)
        });
        break;
      case "filter":
        setData(
          {
            ...data,
            data: data.data.filter(u => u.id !== socketUser.id)
          },
          0,
          true
        );
        break;
      case "update":
        setData({
          ...data,
          data: data.data.map(u => (u.id === socketUser.id ? socketUser : u))
        });
        break;
      default:
        break;
    }
  }, []);

  const { following, toggleFollow, isProcessingFollow } = useFollowDispatch(
    undefined,
    priority,
    _following || userFollowing
  );
  useEffect(() => {
    const user = previewUser?.followUser;
    if (user && user.id === userId) {
      if (user.filter) {
        if (priority !== "toggle") {
          if (priority === user.priority) handleAction("new", user);
          else handleAction("filter", user);
        }
      } else {
        priority !== "toggle" && handleAction("filter", user);
        if (user.isFollowing)
          priority === "follow" && handleAction("new", user);
        else {
          (user.priority ===
            {
              follow: "unfollow",
              unfollow: "follow"
            }[priority] ||
            (user.priority === "toggle" && priority === "unfollow")) &&
            handleAction("new", user);
        }
      }
      stateRef.current[priority].followId = user.id + userId;
      stateRef.current[priority].unfollowId = user.id + userId;
    }
  }, [previewUser?.followUser, handleAction, priority, userId]);

  useEffect(() => {
    const handleFollowing = toFollow => ({ to, from }) => {
      const isFrm = from.id === userId;
      const isTo = to.id === userId;
      const key = (toFollow ? "followId" : "unfollowId") + to.id + from.id;
      if (isTo || isFrm) {
        if (stateRef.current[key]) return;
        stateRef.current[key] = true;
        if (isTo && priority === "toggle")
          handleAction(toFollow ? "new" : "filter", from);
        else if (isFrm) {
          if (priority === "unfollow")
            handleAction(toFollow ? "new" : "filter", to);
          else if (priority === "follow")
            handleAction(toFollow ? "filter" : "new", to);
          else handleAction("update", to);
        }
        stateRef.current[
          (toFollow ? "unfollowId" : "followId") + to.id + from.id
        ] = undefined;
      }
    };

    socket.on("unfollow", handleFollowing());
    socket.on("follow", handleFollowing(true));
    socket.on("suggest-followers", data => {
      if (priority === "follow" && !stateRef.current[priority]) {
        stateRef.current[priority] = true;
        infiniteScrollRef.current.setData({
          ...data,
          data: infiniteScrollRef.current.data.data.concat(data.data)
        });
        stateRef.current[priority] = undefined;
      }
    });
  }, [socket, dispatch, handleAction, userId, priority, isCurrentUser]);
  return (
    <InfiniteScroll
      key={"follome-widget-" + priority}
      ref={infiniteScrollRef}
      url={
        {
          suggest: `/users/${userId}/suggest-followers`,
          followers: `/users/${userId}/followers`,
          following: `/users/${userId}/following`
        }[url] || url
      }
      Component={WidgetContainer}
      fullHeight={false}
      searchParams={searchParams}
      {...infiniteScrollProps}
      withCredentials={!!(cid || following)}
      verify={priority === "toggle"}
      notifierDelay={
        isCurrentUser ? (priority === "toggle" ? undefined : -1) : undefined
      }
    >
      {({ data: { data }, setObservedNode }) => {
        const renderPersons = () => {
          return data.map((u = {}, i) => {
            const isFollowing = {
              toggle: following && following.includes(u.id),
              follow: false,
              unfollow: true
            }[userId === cid ? priority : "toggle"];

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
                  following ? (isFollowing ? "Unfollow" : "Follow") : null
                }
                onBtnClick={e => toggleFollow(e, u, isFollowing)}
                disabled={isProcessingFollow}
                isOwner={u.id === cid}
              />
            );
          });
        };
        return (
          <>
            {title || secondaryTitle ? (
              <div style={{ marginBottom: "16px" }}>
                <Typography variant="h5" fontWeight="bold">
                  {title}
                </Typography>
                {secondaryTitle ? data.length + " " + secondaryTitle : null}
              </div>
            ) : null}
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
          </>
        );
      }}
    </InfiniteScroll>
  );
};

FollowMeWidget.propTypes = {};

export default FollowMeWidget;
