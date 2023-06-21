import { useState, useCallback, useRef, useMemo } from "react";
import http from "api/http";
import { useContext } from "context/store";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "context/slices/userSlice";

export default (options = {}) => {
  const { user, priority = "toggle", following, docId } = options;
  const { setSnackBar, setContext } = useContext();
  const { following: ffl, id: cid } = useSelector(
    ({ user: { currentUser } }) => currentUser
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
  const [activeFollowId, setActiveFollowId] = useState("");

  const stateRef = useRef({});

  const toggleFollow = useCallback(
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

      if (cid) {
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
      _following,
      isFollowing,
      setSnackBar,
      user,
      setContext,
      docId,
      cid
    ]
  );
  return {
    toggleFollow,
    activeFollowId,
    isFollowing,
    isLoggedIn: !!cid,
    following: _following,
    isProcessingFollow: user ? activeFollowId === user.id : !!activeFollowId
  };
};
