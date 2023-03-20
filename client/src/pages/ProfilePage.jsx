import React, { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import UserWidget from "../components/UserWidget";
import FollowMeWidget from "../components/FollowMeWidget";
import PostsView from "../components/PostsView";
import InputBox from "../components/InputBox";
import UserProfileForm from "../components/UserProfileForm";
import {
  Button,
  Typography,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useParams, useNavigate } from "react-router-dom";
import ShortsWidget from "components/ShortsWidget";
import { useContext } from "redux/store";
import http from "api/http";
import { useDispatch, useSelector } from "react-redux";
import { StyledLink } from "components/styled";
import Compose from "pages/Compose";
Dialog.defaultProps = {
  open: false
};
const ProfilePage = () => {
  let { userId } = useParams();
  const { socket } = useContext();
  const [user, setUser] = useState();
  const navigate = useNavigate();
  const { id } = useSelector(state => {
    return state.user.currentUser || {};
  });
  const isCurrentUser = id === userId;
  useEffect(() => {
    console.log("once...");
    (async () => {
      try {
        setUser(await http.get(`/users/${userId}`));
      } catch (message) {
        console.log(message);
        // if (status === 400) setUser({});
        setUser(null);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (user?.id) {
      socket.on("update-user", u => {
        console.log("updaitng user... ", user.id);
        u.id === user.id && setUser(u);
      });
    }
  }, [isCurrentUser, socket, user?.id]);

  if (user === undefined) return <div>loading...</div>;
  else if (!user) return <div>Something went wrong try again...</div>;
  else if (!user.id)
    return (
      <div>
        Looks like you search for a non existing user. check{" "}
        <StyledLink to="/">feed</StyledLink> for more user
      </div>
    );
  const width = {
    md: "48%"
  };

  return (
    <>
      <Layout
        routePage="profilePage"
        gridBreakpoint="768px"
        sx={{
          flexWrap: "wrap",
          gap: 3,
          maxWidth: "1024px",
          pt: 2,
          "& > *": {
            width: {
              xs: "100%",
              md: "48%"
            }
          }
        }}
        key={userId}
      >
        <UserWidget width={width} hideUserSettingsIcon user={user} />
        {isCurrentUser ? (
          <UserProfileForm
            placeholders={user}
            width={width}
            withConfirmPwd={true}
          />
        ) : null}
        <FollowMeWidget
          url="followers"
          title={isCurrentUser ? "Your Followers" : "Followers"}
          secondaryTitle="followers"
          width={width}
          filterUser={false}
          readOnly={!isCurrentUser}
        />
        <FollowMeWidget
          url="following"
          title={isCurrentUser ? "People you follow" : "Following"}
          secondaryTitle="following"
          width={width}
          priority="unfollow"
          isCurrentUser={isCurrentUser}
        />

        <FollowMeWidget width={width} priority="follow" />
      </Layout>
      <Compose
        openFor={{
          "create-post": true,
          "create-short": true,
          "user-shorts": true,
          "user-posts": true
        }}
      />
    </>
  );
};

export default ProfilePage;
