import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <Box>
      <Navbar />
      <Box component="main">{children}</Box>
    </Box>
  );
};

Layout.propTypes = {};

export default Layout;
