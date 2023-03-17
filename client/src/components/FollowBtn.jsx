import React, { useState } from "react";

import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import http from "api/http";
import { useContext } from "redux/store";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "redux/userSlice";

const FollowBtn = ({ user, priority, variant = "radius" }) => {
  const currentUser = useSelector(state => state.user.currentUser);
  const dispatch = useDispatch();
  const { setSnackBar } = useContext();
  const [disabled, setDisabled] = useState(false);

  const isFollowing = currentUser.following.includes(user.id);

    const toggleFollow = async e => {
    if (currentUser) {
      if (e) e.stopPropagation();
      const prop = {};
      const updateFollowMe = isFollowing => {
        setDisabled(true);
        dispatch(
          updatePreviewUser({
            followUser: {
              ...user,
              priority,
              isFollowing
            }
          })
        );
        prop.following = isFollowing
          ? currentUser.following.filter(id => id !== user.id)
          : [user.id, ...currentUser.following];
        dispatch(updateUser(prop));
        if (priority === "toggle") setDisabled(false);
      };

      try {
        updateFollowMe(isFollowing);
        await http.put(
          `/users/${user.id}/${isFollowing ? "unfollow" : "follow"}`
        );
      } catch (message) {
        setSnackBar(message);
        updateFollowMe(!isFollowing);
      }
    } else setSnackBar();
  }
  return (
    <Button
      variant={{}[variant] || "contained"}
      sx={{
        borderRadius: 6,
        boxShadow: "none",
        color: "primary.dark",
        backgroundColor: "primary.light",
        backgroundImage: "none",
        "&:hover": {
          backgroundColor: "primary.light",
          boxShadow: "none"
        },
        flexShrink: 0
      }}
      onClick={toggleFollow}
      disabled={disabled}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};

FollowBtn.propTypes = {};

export default FollowBtn;
