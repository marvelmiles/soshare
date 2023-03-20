import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Box, Dialog, DialogContent, Button } from "@mui/material";
import Layout from "../components/Layout";
import UserWidget from "../components/UserWidget";
import InputBox from "../components/InputBox";
import PostsView from "../components/PostsView";
import AdvertWidget from "../components/AdvertWidget";
import FollowMeWidget from "../components/FollowMeWidget";
import ShortsWidget from "../components/ShortsWidget";
import { Link } from "react-router-dom";
import MainView from "views/MainView";

const HomePage = () => {
  const { id } = useSelector(state => state.user.currentUser || {});
  const rootRef = useRef();

  return (
    <MainView borderline>
      {/* <Button disabled>ss</Button> */}
      <PostsView
        sx={{
          p: 0
        }}
        rootRef={rootRef}
      >
        {id ? (
          <InputBox
            sx={{
              mb: 0,
              // borderBottom: "1px solid #fff",
              // borderBottomColor: "divider",
              borderRadius: 0,
              backgroundColor: "transparent"
            }}
          />
        ) : null}
      </PostsView>
    </MainView>
  );
};

export default HomePage;
