import React from "react";
import PropTypes from "prop-types";
import Layout from "components/Layout";
import EmptyData from "components/EmptyData";
import { StyledLink } from "components/styled";

const Page404 = props => {
  return (
    <Layout>
      <EmptyData
        maxWidth="350px"
        label={
          <>
            Oops! Looks like you took a wrong turn somewhere! While you're here,
            why not grab a cup of coffee and let reel through some{" "}
            <StyledLink sx={{ textDecoration: "underline" }} to="/shorts">
              exicting shorts
            </StyledLink>
            !
          </>
        }
      />
    </Layout>
  );
};

Page404.propTypes = {};

export default Page404;
