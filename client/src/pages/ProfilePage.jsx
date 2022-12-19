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
import { useSearchParams } from "react-router-dom";
Dialog.defaultProps = {
  open: false
};
const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState({});

  useEffect(() => {
    const activeDialog = (searchParams.get("d") || "").toLowerCase();
    if (
      activeDialog &&
      {
        "create-post": true,
        "user-posts": true
      }[activeDialog]
    ) {
      setDialog({
        open: true,
        activeDialog
      });
    }
  }, [searchParams]);

  const width = {
    md: "48%"
  };

  const closeDialog = () => {
    setSearchParams({});
    setDialog({
      ...dialog,
      open: false
    });
  };

  const renderDialog = () => {
    switch (dialog.activeDialog) {
      case "create-post":
        return (
          <>
            <DialogTitle
              sx={{
                border: "1px solid #333",
                borderColor: "divider"
              }}
              component={Stack}
            >
              <Typography variant="h5" fontWeight="bold">
                Share your moment
              </Typography>
              <IconButton onClick={closeDialog}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <InputBox autoFocus />
            </DialogContent>
          </>
        );
      default:
        return (
          <>
            <DialogContent>
              <PostsView />
            </DialogContent>
            <DialogActions
              sx={{
                borderTop: "1px solid #333",
                borderColor: "divider",
                display: {
                  xs: "block",
                  md: "none"
                }
              }}
            >
              <Button variant="contained" onClick={closeDialog}>
                Cancel
              </Button>
            </DialogActions>
          </>
        );
    }
  };

  return (
    <>
      <Layout
        wrap
        maxWidth="1024px"
        routePage="profilePage"
        gridBreakpoint="768px"
        alignItems="normal"
      >
        <UserWidget width={width} hideUserSettingsIcon />
        <UserProfileForm width={width} />
        <FollowMeWidget url="followers" title="Your Followers" width={width} />
        <FollowMeWidget
          url="following"
          title="People you follow"
          width={width}
        />
        <FollowMeWidget width={width} />
      </Layout>
      <Dialog
        open={dialog.open}
        onClose={closeDialog}
        PaperProps={{
          sx: {
            m: {
              xs: 0,
              s320: 2
            }
          }
        }}
      >
        {renderDialog()}
      </Dialog>
    </>
  );
};

export default ProfilePage;
