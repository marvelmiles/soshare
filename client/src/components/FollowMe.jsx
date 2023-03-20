import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { StyledTypography, StyledButton } from "./styled";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useContext } from "../redux/store";
import http from "api/http";
import useFollowDispatch from "hooks/useFollowDispatch";
import { Link } from "react-router-dom";

const FollowMe = ({
  user = {},
  priority = "toggle",
  ownerAction,
  variant = "flex",
  mb = 3
}) => {
  const isOwner = useSelector(
    state => (state.user.currentUser || {}).id === user.id
  );
  const {
    isFollowing,
    toggleFollow,
    isProcessingFollow,
    isLoggedIn
  } = useFollowDispatch(user.id, priority);

  switch (variant) {
    case "block":
      return (
        <Box
          sx={{
            backgroundColor: "#fff",
            boxShadow: 3,
            borderRadius: 3,
            p: 2,
            width: "30%",
            textAlign: "center",
            mb: 2
          }}
        >
          <Avatar variant="md" sx={{ mx: "auto" }} src={user.photoUrl} />
          <StyledTypography pt="16px" $maxLine={5}>
            @{user.username}
          </StyledTypography>
          <StyledButton
            variant="contained"
            sx={{
              borderRadius: 4,
              mt: "16px"
            }}
            onClick={toggleFollow}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </StyledButton>
        </Box>
      );
    default:
      return (
        <Stack
          alignItems="flex-start"
          sx={{
            mb,
            flexWrap: "wrap"
          }}
        >
          <Stack
            sx={{
              minWidth: {
                xs: "100%",
                s320: "50px"
              },
              flex: 1
              // border: "1px solid red"
            }}
            alignItems="flex-start"
            justifyContent="normal"
          >
            <Avatar
              variant="md"
              src={user.photoUrl}
              component={Link}
              to={`/u/${user.id}`}
            />
            <Box
              sx={{
                minWidth: 0,
                "& > *": {
                  display: "flex"
                }
              }}
            >
              <Box>
                <StyledTypography
                  fontWeight="500"
                  variant="caption"
                  color="common.dark"
                  $textEllipsis
                >
                  {isOwner ? "You" : user.displayName || user.username}
                </StyledTypography>
              </Box>
              <Box>
                <StyledTypography
                  variant="caption"
                  color="common.dark"
                  $textEllipsis
                  sx={{ minWidth: 0, flex: 1 }}
                >
                  @{user.username}
                </StyledTypography>
              </Box>
            </Box>
          </Stack>
          {isOwner ? (
            <div>{ownerAction}</div>
          ) : (
            <StyledButton
              variant={{}[variant] || "contained"}
              sx={{
                borderRadius: 6,
                flexShrink: 0
              }}
              onClick={toggleFollow}
              disabled={isProcessingFollow}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </StyledButton>
          )}
        </Stack>
      );
  }
};

FollowMe.propTypes = {};

export default FollowMe;
