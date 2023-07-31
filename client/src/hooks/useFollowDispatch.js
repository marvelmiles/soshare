import { useState, useCallback, useRef, useMemo } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "context/slices/userSlice";

export default (options = {}) => {
  const { user, priority = "toggle", docId } = options;

  const { setSnackBar, setContext } = useContext();

  const { following, id: cid } = useSelector(
    ({ user: { currentUser } }) => currentUser
  );

  const isFollowing = useMemo(
    () =>
      user
        ? {
            toggle: following.includes(user.id),
            follow: false,
            unfollow: true
          }[priority]
        : undefined,
    [following, priority, user]
  );

  const isLoggedIn = !!cid;
  const dispatch = useDispatch();
  const [activeFollowId, setActiveFollowId] = useState("");

  const stateRef = useRef({});

  const handleToggleFollow = useCallback(
    async (e, _user, _isFollowing) => {
      if (e) e.stopPropagation();

      _isFollowing =
        typeof _isFollowing === "boolean" ? _isFollowing : isFollowing;

      _user = _user || user;

      const url = `/users/${_user.id}/${_isFollowing ? "unfollow" : "follow"}`;

      const updateFollowMe = isFollowing => {
        const prop = {};

        setActiveFollowId(_user.id);

        dispatch(
          updatePreviewUser({
            key: "followUser",
            value: {
              ..._user,
              isFollowing
            }
          })
        );

        prop.following = isFollowing
          ? following.filter(id => id !== _user.id)
          : [_user.id, ...following];

        dispatch(updateUser(prop));
        setActiveFollowId("");
      };

      if (isLoggedIn) {
        if (stateRef.current.isProc) return;
        stateRef.current.isProc = true;
        try {
          updateFollowMe(_isFollowing);
          await http.put(url);
        } catch (message) {
          message && setSnackBar(message);
          updateFollowMe(!_isFollowing);
        } finally {
          stateRef.current.isProc = false;
        }
      } else {
        setContext(prev => ({
          ...prev,
          composeDoc: {
            url,
            reason: "request",
            method: "put",
            document: {
              id: docId
            },
            done: false,
            onSuccess() {
              updateFollowMe(_isFollowing);
            }
          }
        }));
        setSnackBar();
      }
    },
    [
      dispatch,
      following,
      isFollowing,
      setSnackBar,
      user,
      setContext,
      docId,
      isLoggedIn
    ]
  );
  return {
    handleToggleFollow,
    activeFollowId,
    isFollowing,
    isLoggedIn,
    following,
    isProcessingFollow: user ? activeFollowId === user.id : !!activeFollowId
  };
};
