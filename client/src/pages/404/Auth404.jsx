import React from "react";
import PropTypes from "prop-types";
import EmptyData from "components/EmptyData";
import { StyledLink } from "components/styled";
const Auth404 = () => {
  return (
    <EmptyData
      maxWidth="320px"
      label={
        <>
          Auth page not found. <StyledLink to="/auth/signin">Signin</StyledLink>{" "}
          or <StyledLink to="/auth/signup">create a new account</StyledLink> to
          be authenticated
        </>
      }
    />
  );
};

Auth404.propTypes = {};

export default Auth404;
