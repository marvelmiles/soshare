import React, { useState, useEffect, useCallback } from "react";
import Layout from "components/Layout";
import UserWidget from "components/UserWidget";
import FollowMeView from "views/FollowMeView";
import UserProfileForm from "components/UserProfileForm";
import { useParams, useSearchParams } from "react-router-dom";
import { useContext } from "context/store";
import http from "api/http";
import { useSelector } from "react-redux";
import Loading from "components/Loading";
import { Stack } from "@mui/material";
import User404 from "./404/User404";
import { useDispatch } from "react-redux";
import Redirect from "components/Redirect";
import EmptyData from "components/EmptyData";
import { HTTP_CODE_USER_BLACKLISTED } from "context/constants";

const ProfilePage = () => {
  let { userId } = useParams();
  const [searchParams] = useSearchParams();

  const { socket } = useContext();

  const { id: cid, _blockedUsers } = useSelector(state => {
    return state.user.currentUser;
  });

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState({});

  const blocked = !!_blockedUsers[(user?.id)];

  const [redirect, setRedirect] = useState(blocked);

  const dispatch = useDispatch();

  const isCurrentUser = cid === userId;

  const withCid = (searchParams.get("wc") || "").toLowerCase() === "true";

  const fetchUser = useCallback(async () => {
    try {
      setUser(
        (await http.get(`/users/${userId}`, { withCredentials: !!cid })) || {}
      );
    } catch (err) {
      if (err.isCancelled) return;

      if (err.status === 404) setUser({ id: "404" });
      else if (err.code === HTTP_CODE_USER_BLACKLISTED)
        setUser({ id: "blacklisted" });
      else setUser({ id: "error" });
    } finally {
      setLoading(false);
    }
  }, [userId, cid]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (socket) {
      const handleUpdate = u => {
        if (u.id === user?.id) setUser(u);
      };

      socket.on("update-user", handleUpdate);

      return () => {
        socket.removeEventListener("update-user", handleUpdate);
      };
    }
  }, [isCurrentUser, socket, user?.id, dispatch]);

  useEffect(() => {
    if (blocked) setRedirect(true);
  }, [blocked]);

  const width = {
    md: "48%"
  };

  const handleRefetch = () => fetchUser();

  return (
    <>
      <Layout
        uid={withCid ? cid : userId}
        isCurrentUser={isCurrentUser}
        routePage="profilePage"
        key={userId}
        closeDialog={blocked}
      >
        {redirect ? (
          <Redirect />
        ) : loading || !user.id ? (
          <Loading />
        ) : (
          {
            error: <EmptyData onClick={handleRefetch} />,
            404: <User404 contentOnly />,
            blacklisted: (
              <EmptyData
                label={
                  <span>
                    We're sorry, you are not allowed to view this page. We
                    strive to provide a safe and positive community experience
                    for all our users, and as such, we do not permit access to
                    content owned by blacklisted curators.
                  </span>
                }
                maxWidth="500px"
              />
            )
          }[user.id] || (
            <Stack
              alignItems="flex-start"
              justifyContent="normal"
              sx={{
                flexWrap: "wrap",
                gap: 2,
                maxWidth: "1024px",
                mx: "auto",
                pt: 2,
                width: "100%",
                p: 2,
                "& > *,& > .data-scrollable,& > .widget-container": {
                  flex: "none",
                  minWidth: {
                    xs: "100%",
                    md: "48%"
                  },
                  width: {
                    xs: "100%",
                    md: "48%"
                  }
                }
              }}
            >
              <UserWidget
                key={`profile-${user.id}`}
                width={width}
                user={user}
                isCurrentUser={isCurrentUser}
              />

              {isCurrentUser ? (
                <UserProfileForm
                  key="profile-page-user-form"
                  placeholders={user}
                  width={width}
                  hidePwd
                />
              ) : null}

              <FollowMeView
                url="followers"
                title={isCurrentUser ? "Your Followers" : "Followers"}
                secondaryTitle="followers"
                width={width}
                variant="flex"
                key="followers"
                infiniteScrollProps={{
                  verify: "z"
                }}
              />

              <FollowMeView
                url="following"
                title={isCurrentUser ? "People you follow" : "Following"}
                secondaryTitle="following"
                width={width}
                priority="unfollow"
                variant="flex"
                key="following"
                infiniteScrollProps={{
                  verify: "z"
                }}
              />

              {isCurrentUser ? (
                <FollowMeView
                  width={width}
                  variant="flex"
                  key="suggest"
                  title="People to follow"
                  priority="follow"
                  infiniteScrollProps={{
                    verify: "m"
                  }}
                />
              ) : null}
            </Stack>
          )
        )}
      </Layout>
    </>
  );
};

export default ProfilePage;
