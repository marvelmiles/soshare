import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import Navbar from "./Navbar";

const Layout = ({
  children,
  wrap,
  maxWidth = "1600px",
  routePage,
  gridBreakpoint = "1024px",
  activeMenuItem
}) => {
  return (
    <Box>
      <Navbar routePage={routePage} activeMenuItem={activeMenuItem} />
      <Box
        component="main"
        sx={{
          maxWidth,
          display: "block",
          width: "100%",
          padding: "16px 0",
          position: "relative",
          minHeight: "calc(100vh - 64px)",
          mx: "auto",
          py: 2,
          px: {
            xs: 0,
            s280: 2
          },
          [`@media (min-width:${gridBreakpoint})`]: {
            display: "flex",
            alignItems: "flex-start",
            gap: wrap ? 3 : 2,
            flexWrap: wrap ? "wrap" : "nowrap"
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

Layout.propTypes = {};

export default Layout;
