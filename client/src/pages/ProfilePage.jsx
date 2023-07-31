import React, { useState, useEffect } from "react";
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

const ProfilePage = () => {
  let { userId } = useParams();
  const [searchParams] = useSearchParams();

  const { socket } = useContext();

  const { id: cid, blockedUsers } = useSelector(state => {
    return state.user.currentUser;
  });

  const [user, setUser] = useState();

  const blocked = !!blockedUsers[(user?.id)];

  const [redirect, setRedirect] = useState(blocked);

  const dispatch = useDispatch();

  const isCurrentUser = cid === userId;

  const withCid = (searchParams.get("wc") || "").toLowerCase() === "true";

  useEffect(() => {
    (async () => {
      try {
        setUser(await http.get(`/users/${userId}`, { withCredentials: !!cid }));
      } catch (message) {
        setUser(null);
      }
    })();
  }, [userId, cid]);

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
        ) : user === undefined ? (
          <Loading />
        ) : user?.id ? (
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
              key="profile-page-user-widget"
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
                verify: "m"
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
        ) : (
          <User404 contentOnly />
        )}
      </Layout>
    </>
  );
};

export default ProfilePage;
