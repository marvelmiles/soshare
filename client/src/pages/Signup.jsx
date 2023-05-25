import React from "react";
import UserProfileForm from "../components/UserProfileForm";
import { Stack, Typography } from "@mui/material";
import { StyledLink } from "../components/styled";

const Signup = () => {
  return (
    <Stack
      justifyContent="center"
      sx={{
        minHeight: "100vh",
        width: "100%",
        py: 1
      }}
    >
      <UserProfileForm sx={{ maxWidth: "576px" }}>
        <Typography textAlign="center" mt={1}>
          Already have an account?{" "}
          <StyledLink to="/auth/signin">Signin!</StyledLink>
        </Typography>
      </UserProfileForm>
    </Stack>
  );
};

export default Signup;
