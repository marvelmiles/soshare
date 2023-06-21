import React, { useCallback } from "react";
import UserProfileForm from "../components/UserProfileForm";
import { Stack, Typography } from "@mui/material";
import { StyledLink } from "../components/styled";
import { createRelativeURL } from "api/http";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useContext } from "context/store";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get("redirect");
  const {
    context: { userPlaceholder, userPlaceholderMethod },
    setContext
  } = useContext();
  const _handleAction = useCallback(
    reason => {
      switch (reason) {
        case "new":
          redirect && navigate(decodeURIComponent(redirect));
          setContext(prev => ({
            ...prev,
            userPlaceholder: undefined,
            userPlaceholderMethod: undefined
          }));
          break;
        default:
          break;
      }
    },
    [navigate, redirect, setContext]
  );

  return (
    <Stack
      justifyContent="center"
      sx={{
        minHeight: "100vh",
        width: "100%",
        py: 1
      }}
    >
      <UserProfileForm
        requiredOnly
        sx={{ maxWidth: "576px" }}
        handleAction={_handleAction}
        placeholders={userPlaceholder}
        method={userPlaceholderMethod}
      >
        <Typography textAlign="center" mt={1}>
          Already have an account?{" "}
          <StyledLink
            to={`/auth/signin?${
              redirect
                ? `redirect=${encodeURIComponent(createRelativeURL("view"))}`
                : ""
            }`}
          >
            Signin!
          </StyledLink>
        </Typography>
      </UserProfileForm>
    </Stack>
  );
};

export default Signup;
