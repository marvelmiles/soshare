import { useState, useCallback, useRef } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "context/slices/userSlice";

export default (user, priority = "toggle") => {
  const following = useSelector(state => state.user.currentUser || {})
    .following;
  const dispatch = useDispatch();
  const { setSnackBar } = useContext();
  const [activeFollowId, setActiveFollowId] = useState("");
  const [isFollowing, setIsFollowing] = useState(
    user
      ? following
        ? {
            toggle: following.includes(user.id),
            follow: false,
            unfollow: true
          }[priority]
        : false
      : false
  );
  const stateRef = useRef({});
  const toggleFollow = useCallback(
    async (e, _user, _isFollowing) => {
      if (e) e.stopPropagation();
      if (following) {
        _user = _user || user;
        _isFollowing =
          typeof _isFollowing === "boolean" ? _isFollowing : isFollowing;

        if (stateRef.current.isProc) return;
        stateRef.current.isProc = true;
        const prop = {};
        const updateFollowMe = (isFollowing, filter) => {
          setActiveFollowId(_user.id);
          setIsFollowing(
            {
              toggle: !isFollowing,
              follow: false,
              unfollow: true
            }[priority]
          );
          dispatch(
            updatePreviewUser({
              followUser: {
                ..._user,
                priority,
                isFollowing,
                filter
              }
            })
          );
          prop.following = isFollowing
            ? following.filter(id => id !== _user.id)
            : [_user.id, ...following];
          dispatch(updateUser(prop));
          setActiveFollowId("");
        };
        try {
          updateFollowMe(_isFollowing);
          await http.put(
            `/users/${_user.id}/${_isFollowing ? "unfollow" : "follow"}`
          );
        } catch (message) {
          setSnackBar(message);
          updateFollowMe(!_isFollowing, true);
        } finally {
          stateRef.current.isProc = false;
        }
      } else setSnackBar();
    },
    [dispatch, following, isFollowing, priority, setSnackBar, user]
  );
  return {
    toggleFollow,
    activeFollowId,
    isFollowing,
    isLoggedIn: !!following,
    following,
    isProcessingFollow: activeFollowId === user?.id
  };
};
