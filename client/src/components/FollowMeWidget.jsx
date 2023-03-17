import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import { Typography } from "@mui/material";
import FollowMe from "./FollowMe";
import { Snackbar } from "@mui/material";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import http from "api/http";
import { useContext } from "redux/store";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "redux/userSlice";
import { useParams } from "react-router-dom";
import InfiniteScroll from "components/InfiniteScroll";
const FollowMeWidget = ({
  title = "People to follow",
  url = "suggest",
  priority = "toggle",
  secondaryTitle,
  width
}) => {
  const { currentUser, previewUser } = useSelector(state => state.user || {});
  let { userId } = useParams();
  const { setSnackBar, socket } = useContext();
  const dispatch = useDispatch();
  const isCurrentUser = useMemo(() => currentUser?.id === userId, [
    currentUser?.id,
    userId
  ]);
  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    toggle: {},
    follow: {},
    unfollow: {}
  }).current;
  const handleAction = useCallback((reason, socketUser) => {
    const { setData } = infiniteScrollRef.current;
    switch (reason) {
      case "new":
        setData(data => {
          if (data.data.length >= data.data.length + 1) return data;
          return {
            ...data,
            data: [socketUser, ...data.data]
          };
        });
        break;
      case "filter":
        setData(data => {
          if (data.data.length <= data.data.length - 1) return data;
          return {
            ...data,
            data: data.data.filter(u => u.id !== socketUser.id)
          };
        });
      case "update":
        setData(data => {
          const users = [];
          for (let i = 0; i < data.data.length; i++) {
            if (socketUser.id !== data.data[i].id) users.push(data.data[i]);
            else users.push(socketUser);
          }
          return {
            ...data,
            data: users
          };
        });
      default:
        break;
    }
  }, []);

  useEffect(() => {
    const user = previewUser?.followUser;
    if (user) {
      priority !== "toggle" && handleAction("filter", user);
      if (user.isFollowing) priority === "follow" && handleAction("new", user);
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
  }, [previewUser?.followUser, handleAction, priority]);

  useEffect(() => {
    socket.on("unfollow", ({ to, from }) => {
      console.log("socket unfollow");
      if (to.id === currentUser.id) {
        if (stateRef[priority].unfollowId === to.id + from.id) return;
        stateRef[priority].unfollowId = to.id + from.id;
        if (priority === "toggle") handleAction("filter", from);
      }
    });
    socket.on("follow", ({ to, from }) => {
      console.log("socket follow");
      if (to.id === currentUser.id) {
        if (stateRef[priority].followId === to.id + from.id) return;
        stateRef[priority].followId = to.id + from.id;
        if (priority === "toggle") handleAction("new", from);
      }
    });
  }, [
    socket,
    dispatch,
    currentUser?.id,
    handleAction,
    userId,
    priority,
    isCurrentUser,
    stateRef
  ]);

  // if (priority === "follow" && !(currentUser || users.length)) return null;
  return (
    <InfiniteScroll
      ref={infiniteScrollRef}
      url={
        {
          suggest: `/users/${userId}/suggest-followers`,
          followers: `/users/${userId}/followers`,
          following: `/users/${userId}/following`
        }[url] || url
      }
      Component={WidgetContainer}
    >
      {({ data: { data } }) => {
        return (
          <>
            {priority}
            <div style={{ marginBottom: "16px" }}>
              <Typography variant="h5" fontWeight="bold">
                {title}
              </Typography>
              {priority}
              {secondaryTitle ? data.length + " " + secondaryTitle : null}
            </div>{" "}
            {data.map((u, i) => (
              <FollowMe
                user={u}
                key={i + u.id}
                priority={isCurrentUser ? priority : "toggle"}
                handleAction={handleAction}
              />
            ))}
          </>
        );
      }}
    </InfiniteScroll>
  );
};

FollowMeWidget.propTypes = {};

export default FollowMeWidget;
