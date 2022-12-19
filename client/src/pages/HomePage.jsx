import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Box, Dialog, DialogContent, Button } from "@mui/material";
import Layout from "../components/Layout";
import UserWidget from "../components/UserWidget";
import InputBox from "../components/InputBox";
import PostsView from "../components/PostsView";
import AdvertWidget from "../components/AdvertWidget";
import UsersWidget from "../components/FollowMeWidget";
import ShortsWidget from "../components/ShortsWidget";
import { Link } from "react-router-dom";

const HomePage = () => {
  const [dialog, setDialog] = useState({});
  const { currentUser } = useSelector(state => state.user);
  return (
    <>
      <Layout>
        <Box
          sx={{
            width: {
              xs: "100%",
              md: "28%"
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
          <ShortsWidget>
            <Button
              variant="contained"
              component={Link}
              sx={{ width: "100%", borderRadius: 4, mt: 2 }}
            >
              Show More
            </Button>
          </ShortsWidget>
          {currentUser ? <UserWidget /> : null}
        </Box>
        <Box
          sx={{
            width: {
              xs: "100%",
              lg: "44%"
            }
          }}
        >
          {currentUser ? <InputBox /> : null}
          <PostsView />
        </Box>
        <Box
          sx={{
            width: {
              xs: "100%",
              lg: "28%"
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
      <Dialog>
        {
          {
            shorts: <ShortsWidget />
          }[dialog.activeDialog]
        }
        <DialogContent>
          <Button>Close</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HomePage;
