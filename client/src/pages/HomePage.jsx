import React from "react";
import { Box, Stack, useMediaQuery } from "@mui/material";
import Layout from "../components/Layout";
import UserWidget from "../components/UserWidget";
import InputBox from "../components/InputBox";
import PostsView from "../components/PostsView";
import AdvertWidget from "../components/AdvertWidget";
import UsersWidget from "../components/FollowMeWidget";
import ShortsWidget from "../components/ShortsWidget";

const HomePage = () => {
  return (
    <Layout>
      <Box
        sx={{
          width: {
            xs: "100%",
            md: "26%"
          },
          display: {
            xs: "none",
            lg: "block"
          },
          position: "sticky",
          left: 0,
          top: 80
        }}
      >
        <ShortsWidget />
        <UserWidget />
      </Box>
      <Box
        sx={{
          width: {
            xs: "100%",
            lg: "42%"
          }
        }}
      >
        <InputBox />
        <PostsView />
      </Box>
      <Box
        sx={{
          width: {
            xs: "100%",
            lg: "26%"
          },
          display: {
            xs: "none",
            lg: "block"
          },
          position: "sticky",
          left: 0,
          top: -80
        }}
      >
        <AdvertWidget />
        <UsersWidget />
      </Box>
    </Layout>
  );
};

export default HomePage;
