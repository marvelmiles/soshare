import React from "react";
import { Box, Stack } from "@mui/material";
import Layout from "../components/Layout";
import UserWidget from "../components/UserWidget";
import InputBox from "../components/InputBox";
import PostsView from "../components/PostsView";
import AdvertWidget from "../components/AdvertWidget";
import UsersWidget from "../components/FollowMeWidget";

const Home = () => {
  return (
    <Layout>
      <Stack
        alignItems="flex-start"
        sx={{
          display: {
            xs: "block",
            lg: "flex"
          },
          width: "100%",
          maxWidth: "1600px",
          mx: "auto",
          py: 2,
          px: {
            xs: 0,
            s280: 2
          },
          gap: {
            xs: 0,
            s280: 2
          },
          position: "relative"
        }}
      >
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
            top: 85
          }}
        >
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
            top: -85
          }}
        >
          <AdvertWidget />
          <UsersWidget />
        </Box>
      </Stack>
    </Layout>
  );
};

export default Home;
