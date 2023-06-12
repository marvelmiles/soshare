import React from "react";
import PropTypes from "prop-types";
import EmptyData from "components/EmptyData";
import { StyledLink } from "components/styled";
import Layout from "components/Layout";

const User404 = ({ contentOnly }) => {
  const content = (
    <EmptyData
      label={
        <span>
          Looks like you are searching for a non existing user.{" "}
          <StyledLink to="/search?tab=users">Check here!</StyledLink>
        </span>
      }
    />
  );
  return contentOnly ? (
    content
  ) : (
    <Layout routePage="profilePage">{content}</Layout>
  );
};

User404.propTypes = {};

export default User404;
