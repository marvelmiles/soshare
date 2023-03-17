import React, { useState } from "react";
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

const MainView = ({
  children,
  publicView = "shorts",
  styles = {},
  borderline,
  sx
}) => {
  const { currentUser } = useSelector(state => state.user);

  return (
    <>
      <Layout sx={sx}>
        <Box
          sx={{
            width: {
              xs: "100%",
              md: "40%",
              lg: "30%"
            },
            display: {
              xs: "none",
              lg: "block"
            },
            position: "sticky",
            left: 0,
            top: 80,
            mx: "auto",
            border: "1px solid red"
          }}
        >
          {
            {
              shorts: <ShortsWidget miniShort={true} type="trending" />,
              posts: (
                <PostsView
                  postSx={{
                    border: "1px solid transparent",
                    borderRadius: "8px",
                    width: "90%",
                    mx: "auto"
                  }}
                  plainWidget={false}
                  minHeight={"480px"}
                  sx={{
                    px: 0
                  }}
                />
              )
            }[publicView]
          }
          {currentUser ? <UserWidget /> : null}
        </Box>
        <Box
          sx={{
            height: "inherit",
            minHeight: "inherit",
            alignSelf: "normal",
            width: {
              xs: "100%",
              lg: "45%"
            },
            position: "relative",
            mx: "auto",
            border: "1px solid transparent",
            borderLeftColor: borderline && "divider",
            borderRightColor: borderline && "divider"
            // ...styles.main
          }}
        >
          {children}
        </Box>
        <Box
          sx={{
            width: {
              xs: "100%",
              md: "25%"
            },
            display: {
              xs: "none",
              lg: "block"
            },
            position: "sticky",
            left: 0,
            top: 80,
            mx: "auto"
            // border: "1px solid blue"
          }}
        >
          <AdvertWidget />
        </Box>
      </Layout>
    </>
  );
};

export default MainView;
