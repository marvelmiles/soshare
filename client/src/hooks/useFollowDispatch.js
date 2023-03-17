import { useState, useCallback } from "react";
import http from "api/http";
import { useContext } from "redux/store";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "redux/userSlice";

export default (uid, priority = "toggle") => {
  const following = useSelector(state => state.user.currentUser || {})
    .following;
  const dispatch = useDispatch();
  const { setSnackBar } = useContext();
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const isFollowing = {
    toggle: following?.includes(uid),
    follow: false,
    unfollow: true
  }[priority];

  const toggleFollow = useCallback(
    async e => {
      if (isProcessingFollow) return;
      if (following) {
        if (e) e.stopPropagation();
        const prop = {};
        const updateFollowMe = isFollowing => {
          setIsProcessingFollow(true);
          dispatch(
            updatePreviewUser({
              followUser: {
                // ...user,
                priority,
                isFollowing
              }
            })
          );
          prop.following = isFollowing
            ? following.filter(id => id !== uid)
            : [uid, ...following];
          dispatch(updateUser(prop));
          if (priority === "toggle") setIsProcessingFollow(false);
        };

        try {
          updateFollowMe(isFollowing);
          await http.put(
            `/users/${uid}/${isFollowing ? "unfollow" : "follow"}`
          );
        } catch (message) {
          setSnackBar(message);
          updateFollowMe(!isFollowing);
        }
      } else setSnackBar();
    },
    [
      dispatch,
      following,
      isFollowing,
      priority,
      setSnackBar,
      uid,
      isProcessingFollow
    ]
  );
  return {
    toggleFollow,
    isProcessingFollow,
    isFollowing,
    isLoggedIn: !!following
  };
};
