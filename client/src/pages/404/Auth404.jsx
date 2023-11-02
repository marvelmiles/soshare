import React from "react";
import PropTypes from "prop-types";
import EmptyData from "components/EmptyData";
import { StyledLink } from "components/styled";

const Auth404 = () => {
  return (
    <EmptyData
      maxWidth="320px"
      sx={{ minHeight: "100vh" }}
      label={
        <>
          Auth page not found.{" "}
          <StyledLink to="/auth/signin" sx={{ textDecoration: "underline" }}>
            Signin
          </StyledLink>{" "}
          or{" "}
          <StyledLink to="/auth/signup" sx={{ textDecoration: "underline" }}>
            create a new account
          </StyledLink>{" "}
          to be authenticated
        </>
      }
    />
  );
};

Auth404.propTypes = {};

export default Auth404;
