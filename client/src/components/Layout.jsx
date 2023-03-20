import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import Navbar from "./Navbar";

const Layout = ({
  children,
  wrap,
  routePage,
  maxWidth = "1800px",
  gridBreakpoint = "768px",
  alignItems = "flex-start",
  sx
}) => {
  return (
    <Box>
      <Navbar routePage={routePage} />
      <Box
        component="main"
        sx={{
          maxWidth,
          display: "block",
          width: "100%",
          position: "relative",
          minHeight: "calc(100vh -  64px)",
          // border: "1px solid red",
          mt: "64px",
          mx: "auto",
          px: 2,
          [`@media (min-width:${gridBreakpoint})`]: {
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            flexWrap: "nowrap",
            ...sx
          },
          ...sx
          // display: "none"
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

Layout.propTypes = {};

export default Layout;
