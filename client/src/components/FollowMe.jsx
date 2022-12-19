import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { StyledTypography } from "./styled";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useContext } from "../redux/store";
import http from "api/http";
import { updateUser } from "redux/userSlice";

const FollowMe = ({ user = {}, onSuccess }) => {
  const { currentUser } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const { setSnackBar } = useContext();
  const [isFollowing, setIsFollowing] = useState(
    currentUser.following.includes(user.id)
  );
  const toggleFollow = async () => {
    if (currentUser) {
      await http.put(`/user/${user.id}/${isFollowing ? "unfollow" : "follow"}`);
      const prop = {
        [isFollowing ? "following" : "followers"]: currentUser[
          isFollowing ? "following" : "followers"
        ].filter(id => id !== user.id)
      };
      if (!isFollowing) prop.following = [user.id, ...currentUser.following];
      dispatch(updateUser(prop));
      if (onSuccess) onSuccess();
      else setIsFollowing(true);
    } else setSnackBar();
  };
  return (
    <Stack
      alignItems="flex-start"
      sx={{
        mb: 3,
        flexWrap: "wrap"
      }}
    >
      <Stack
        sx={{
          minWidth: 30,
          gap: 2
        }}
        alignItems="flex-start"
      >
        <Avatar variant="md" src={user.photoUrl} />
        <Box
          sx={{
            minWidth: 30,
            maxWidth: {
              xs: "345px",
              s640: "410px"
            }
          }}
        >
          <div>
            <StyledTypography variant="h6" textEllipsis color="common.dark">
              {user.displayName || user.username}
            </StyledTypography>
            <StyledTypography
              variant="caption"
              textEllipsis
              color="common.dark"
            >
              {user.username}
            </StyledTypography>
          </div>
          <Typography
            color="common.medium"
            sx={{
              wordBreak: "break-word"
            }}
          >
            {user.location}
          </Typography>
        </Box>
      </Stack>
      <Button
        variant="contained"
        sx={{
          borderRadius: 6,
          boxShadow: "none",
          color: "primary.dark",
          backgroundColor: "primary.light",
          backgroundImage: "none",
          "&:hover": {
            backgroundColor: "primary.light",
            boxShadow: "none"
          },
          flexShrink: 0
        }}
        onClick={toggleFollow}
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
    </Stack>
  );
};

FollowMe.propTypes = {};

export default FollowMe;
