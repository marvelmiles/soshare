import { useState, useCallback, useRef, useMemo } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "context/slices/userSlice";

export default (user, priority = "toggle", following) => {
  const ffl = useSelector(
    ({ user: { currentUser } }) => currentUser?.following
  );
  const { _following, isFollowing } = useMemo(() => {
    const _following = following || ffl;
    return {
      _following,
      isFollowing: user
        ? _following
          ? {
              toggle: _following.includes(user.id),
              follow: false,
              unfollow: true
            }[priority]
          : false
        : false
    };
  }, [following, ffl, priority, user]);
  const dispatch = useDispatch();
  const { setSnackBar } = useContext();
  const [activeFollowId, setActiveFollowId] = useState("");

  const stateRef = useRef({});

  const toggleFollow = useCallback(
    async (e, _user, _isFollowing) => {
      if (e) e.stopPropagation();

      if (_following) {
        _user = _user || user;
        _isFollowing =
          typeof _isFollowing === "boolean" ? _isFollowing : isFollowing;

        if (stateRef.current.isProc) return;
        stateRef.current.isProc = true;
        const prop = {};
        const updateFollowMe = isFollowing => {
          setActiveFollowId(_user.id);
          dispatch(
            updatePreviewUser({
              followUser: {
                ..._user,
                isFollowing
              }
            })
          );
          prop.following = isFollowing
            ? _following.filter(id => id !== _user.id)
            : [_user.id, ..._following];

          dispatch(updateUser(prop));
          setActiveFollowId("");
        };
        try {
          updateFollowMe(_isFollowing);
          await http.put(
            `/users/${_user.id}/${_isFollowing ? "unfollow" : "follow"}`
          );
        } catch (message) {
          console.log("message ", message);
          setSnackBar(message);
          updateFollowMe(!_isFollowing);
        } finally {
          stateRef.current.isProc = false;
        }
      } else setSnackBar();
    },
    [dispatch, _following, isFollowing, setSnackBar, user]
  );
  return {
    toggleFollow,
    activeFollowId,
    isFollowing,
    isLoggedIn: !!_following,
    following: _following,
    isProcessingFollow: user ? activeFollowId === user.id : !!activeFollowId
  };
};
