import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { signOutUser } from "context/slices/userSlice";
import { Box, Typography, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { createRelativeURL, handleCancelRequest } from "api/http";
import { useNavigate } from "react-router-dom";

const SessionTimeout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    try {
      dispatch(signOutUser());
    } catch (err) {}
  }, [dispatch]);
  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          maxWidth: "280px",
          textAlign: "center",
          width: "100%",
          mx: "auto",
          py: 2,
          fontWeight: "400"
        }}
      >
        Sorry, your session has timeout. Please login again to continue
      </Typography>
      <Stack
        justifyContent="normal"
        gap={2}
        flexWrap="wrap"
        sx={{
          borderTop: "1px solid currentColor",
          borderTopColor: "divider",
          pt: 1,
          width: "100%"
        }}
      >
        <Button
          sx={{
            ml: "auto"
          }}
          component={Link}
          to={`/auth/signin?redirect=${encodeURIComponent(
            createRelativeURL("view")
          )}`}
          variant="contained"
        >
          Signin
        </Button>
        <Button
          sx={{
            mr: "8px"
          }}
          component={Link}
          to={() => navigate(-1)}
          variant="contained"
        >
          Continue
        </Button>
      </Stack>
    </Box>
  );
};

SessionTimeout.propTypes = {};

export default SessionTimeout;
