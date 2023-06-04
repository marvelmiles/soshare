import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, useMediaQuery } from "@mui/material";
import Layout from "components/Layout";
import UserWidget from "components/UserWidget";
import AdvertWidget from "components/AdvertWidget";
import ShortsView from "views/ShortsView";

const MainView = ({
  children,
  sideView = "shorts",
  borderline = true,
  layoutProps,
  sx
}) => {
  const cid = useSelector(state => (state.user.currentUser || {}).id);
  const responsiveStyle = useMemo(
    () => ({
      "& .data-scrollable-container,& .widget-container": {
        // calc is based on widget max-height
        // helps avoids issue with scrolling down
        // during an infinite view
        maxHeight: window.innerHeight <= 800 ? "300px" : "400px"
      }
    }),
    []
  );
  const isLg = useMediaQuery("(min-width:1024px)");

  return (
    <Layout sx={sx} {...layoutProps} uid={cid}>
      <Box
        sx={{
          width: {
            xs: "100%",
            md: "40%",
            lg: "30%"
          },
          display: {
            xs: "none",
            lg: "block"
          },
          position: "sticky",
          left: 0,
          top: 80,
          mx: "auto",
          ...responsiveStyle
        }}
      >
        {isLg
          ? {
              shorts: (
                <ShortsView key="mainview-shorts" miniShort type="trending" />
              )
            }[sideView]
          : null}
        {cid ? <UserWidget key="main-view-user-widget" /> : null}
      </Box>

      <Box
        sx={{
          height: "inherit",
          minHeight: "inherit",
          boxSizing: "border-box",
          alignSelf: "normal",
          width: {
            xs: "100%",
            lg: "45%"
          },
          position: "relative",
          mx: "auto",
          border: "1px solid transparent",
          borderLeftColor: borderline && "divider",
          borderRightColor: borderline && "divider"
        }}
        className="main-content-container"
      >
        {children}
      </Box>

      <Box
        sx={{
          width: {
            xs: "100%",
            md: "25%"
          },
          display: {
            xs: "none",
            lg: "block"
          },
          position: "sticky",
          left: 0,
          top: 80,
          mx: "auto",
          ...responsiveStyle
        }}
      >
        <AdvertWidget />
      </Box>
    </Layout>
  );
};

export default MainView;
