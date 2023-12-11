import React from "react";
import { useSelector } from "react-redux";
import { Box } from "@mui/material";
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
  const responsiveStyle = {
    "& .data-scrollable,& .widget-container": {
      // calc is based on widget max-height
      // helps avoids issue with scrolling down
      minHeight: window.innerHeight <= 800 ? "290px" : "300px",
      maxHeight: window.innerHeight <= 800 ? "290px" : "400px",
      overflow: "auto"
    }
  };

  return (
    <Layout sx={sx} {...layoutProps} uid={cid}>
      <Box
        sx={{
          width: {
            xs: "100%",
            lg: "28%",
            s1200: "23%",
            s1400: "30%"
          },
          display: {
            xs: "none",
            lg: "block"
          },
          position: "sticky",
          left: 0,
          top: 80,
          mx: "auto",
          maxWidth: "380px",
          ...responsiveStyle
        }}
      >
        {
          {
            shorts: <ShortsView key="mainview-shorts" miniShort mx={"1px"} />
          }[sideView]
        }
        {cid ? <UserWidget key="main-view-user-widget" /> : null}
      </Box>

      <Box
        sx={{
          height: "inherit",
          minHeight: "inherit",
          boxSizing: "border-box",
          alignSelf: "normal",
          width: "100%",
          minWidth: {
            xs: "100%",
            lg: "44%",
            s1200: "49%",
            s1400: "42%"
          },
          maxWidth: {
            lg: "calc(100% - 55%)",
            s1200: "calc(100% - 51%)",
            s1400: "calc(100% - 720px)"
          },
          position: "relative",
          mx: "auto",
          border: "0px solid transparent",
          borderWidth: {
            lg: "1px"
          },
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
            lg: "28%"
          },
          display: {
            xs: "none",
            lg: "block"
          },
          position: "sticky",
          left: 0,
          top: 80,
          mx: "auto",
          maxWidth: "320px",
          ...responsiveStyle
        }}
      >
        <AdvertWidget />
      </Box>
    </Layout>
  );
};

export default MainView;
