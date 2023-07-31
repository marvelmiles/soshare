import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import Navbar from "components/Navbar";
import ComposeAndView from "components/ComposeAndView";
import Fab from "@mui/material/Fab";
import Zoom from "@mui/material/Zoom";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { handleScrollUp } from "utils";

const Layout = ({
  children,
  routePage,
  maxWidth = "1260px",
  gridBreakpoint = "768px",
  sx,
  uid,
  isCurrentUser,
  withGoUpIndicator = true,
  fabIcon,
  handleFabAction,
  closeDialog
}) => {
  const [showBtn, setShowBtn] = useState(false);
  useEffect(() => {
    let handleScroll;
    if (withGoUpIndicator) {
      handleScroll = () => {
        window.scrollY > 500 ? setShowBtn(true) : setShowBtn(false);
      };
      window.addEventListener("scroll", handleScroll, false);
    }
    return () =>
      handleScroll && window.removeEventListener("scroll", handleScroll, false);
  }, [withGoUpIndicator]);
  const transitionDuration = {
    enter: 225,
    exit: 195
  };
  const fabStyle = {
    position: "fixed",
    right: "32px",
    bottom: "25px",
    minWidth: "25px",
    width: "30px",
    minHeight: "25px",
    height: "30px",
    svg: { color: "common.white", fontSize: "2.5em" }
  };
  return (
    <div
      style={{
        minHeight: "inherit",
        height: "inherit",
        width: "inherit",
        minWidth: "inherit"
      }}
    >
      <Box>
        <Navbar routePage={routePage} />
        <Box
          component="main"
          sx={{
            maxWidth,
            display: "block",
            width: "100%",
            position: "relative",
            minHeight: "calc(100vh -  68px)",
            height: "auto",
            top: "64px",
            mx: "auto",
            px: {
              xs: 0,
              lg: 2
            },
            [`@media (min-width:${gridBreakpoint})`]: {
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              ...sx
            },
            ...sx
          }}
        >
          {children}
        </Box>
      </Box>
      <ComposeAndView
        uid={uid}
        isCurrentUser={isCurrentUser}
        close={closeDialog}
      />
      <Zoom
        in={showBtn}
        timeout={transitionDuration}
        style={{
          transitionDelay: `${showBtn ? transitionDuration.exit : 0}ms`
        }}
      >
        <Fab
          color="primary"
          onClick={handleScrollUp}
          sx={
            fabIcon
              ? {
                  ...fabStyle,
                  bottom: "60px"
                }
              : fabStyle
          }
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
      {fabIcon ? (
        <Zoom
          in={showBtn}
          timeout={transitionDuration}
          style={{
            transitionDelay: `${showBtn ? transitionDuration.exit : 0}ms`
          }}
        >
          <Fab color="primary" onClick={handleFabAction} sx={fabStyle}>
            {fabIcon}
          </Fab>
        </Zoom>
      ) : null}
    </div>
  );
};

Layout.propTypes = {};

export default Layout;
