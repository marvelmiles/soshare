import React from "react";
import UserProfileForm from "../components/UserProfileForm";
import { Stack, Button, Typography } from "@mui/material";
import { StyledLink } from "../components/styled";

const Signup = () => {
  return (
    <Stack sx={{ minHeight: "100vh", width: "100%" }}>
      <UserProfileForm
        routePage="signup"
        sx={{ maxWidth: "576px", mx: "auto" }}
      >
        <Typography textAlign="center" mt={1}>
          Already have an account?{" "}
          <StyledLink to="/auth/signin">Signin!</StyledLink>
        </Typography>
      </UserProfileForm>
    </Stack>
  );
};

export default Signup;
