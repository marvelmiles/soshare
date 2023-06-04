import React, { useState, useEffect } from "react";
import Layout from "components/Layout";
import UserWidget from "components/UserWidget";
import FollowMeWidget from "components/FollowMeWidget";
import UserProfileForm from "components/UserProfileForm";
import { useParams, useSearchParams } from "react-router-dom";
import { useContext } from "context/store";
import http from "api/http";
import { useSelector } from "react-redux";
import Loading from "components/Loading";
import { Stack } from "@mui/material";
import User404 from "./404/User404";

import { updateUser, updatePreviewUser } from "context/slices/userSlice";
import { useDispatch } from "react-redux";
const ProfilePage = () => {
  let { userId } = useParams();
  const [searchParams] = useSearchParams();
  const { socket } = useContext();
  const [user, setUser] = useState();
  const dispatch = useDispatch();
  const cid = useSelector(state => {
    return (state.user.currentUser || {}).id;
  });
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
    const handleUpdate = u => {
      if (u.id === user?.id) setUser(u);
    };

    socket.on("update-user", handleUpdate);

    return () => {
      socket.removeEventListener("update-user", handleUpdate);
    };
  }, [isCurrentUser, socket, user?.id, dispatch]);

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
      >
        {user === undefined ? (
          <Loading />
        ) : user?.id ? (
          <Stack
            alignItems="flex-start"
            justifyContent="normal"
            sx={{
              flexWrap: "wrap",
              gap: 3,
              maxWidth: "1024px",
              mx: "auto",
              pt: 2,
              width: "100%",
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
              hideUserSettingsIcon
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
            <FollowMeWidget
              url="followers"
              priority="toggle"
              title={isCurrentUser ? "Your Followers" : "Followers"}
              secondaryTitle="followers"
              width={width}
              filterUser={false}
              readOnly={!isCurrentUser}
              variant="flex"
              key="followers"
              userFollwoing={user.following}
            />
            <FollowMeWidget
              url="following"
              title={isCurrentUser ? "People you follow" : "Following"}
              secondaryTitle="following"
              width={width}
              priority="unfollow"
              isCurrentUser={isCurrentUser}
              variant="flex"
              key="following"
              userFollwoing={user.following}
            />
            {isCurrentUser ? (
              <FollowMeWidget
                width={width}
                variant="flex"
                key="suggest"
                title="People to follow"
                userFollwoing={user.following}
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
