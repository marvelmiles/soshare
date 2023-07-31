import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import MuiTabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Carousel from "react-multi-carousel";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createRelativeURL } from "api/http";

const Tabs = ({
  children,
  tabsPane = [],
  responsive = {
    xs: {
      items: 1,
      breakpoint: { min: 0, max: Infinity }
    }
  },
  defaultTab = "",
  deleteParams,
  searchParams: newParams = "",
  sectionEl
}) => {
  const [searchParams] = useSearchParams();
  const tab = (searchParams.get("tab") || defaultTab).toLowerCase();

  const carouselRef = useRef();
  const stateRef = useRef({
    tabChanged: false,
    tabIndexMap: {},
    tabValueMap: {}
  });

  const navigate = useNavigate();

  useEffect(() => {
    const stateCtx = stateRef.current;
    if (carouselRef.current) {
      stateRef.current.tabChanged = true;
      carouselRef.current.goToSlide(stateCtx.tabIndexMap[tab], {
        skipAfterChange: true
      });
    }
  }, [tab]);

  const handleTabChange = (e, value) => {
    e && e.stopPropagation();
    value &&
      navigate(
        createRelativeURL(
          `tab ${deleteParams}`,
          `tab=${value}${newParams ? `&${newParams}` : ""}`
        ),
        {
          replace: true
        }
      );
  };

  const props = {
    tab,
    tabChanged: stateRef.current.tabChanged
  };

  return (
    <Box
      sx={{
        ".react-multi-carousel-list": {
          mt: 1
        }
      }}
    >
      <MuiTabs
        value={tab}
        onChange={handleTabChange}
        variant="scrollable"
        sx={{
          mb: 1,
          "& .MuiTab-root": {
            flex: 1
          },
          borderBottomColor: "divider"
        }}
      >
        {tabsPane.map((tab, i) => {
          stateRef.current.tabIndexMap[tab.value] = i;
          stateRef.current.tabValueMap[i] = tab.value;

          return <Tab key={i} value={tab.value} label={tab.label} wrapped />;
        })}
      </MuiTabs>
      <div>{sectionEl && sectionEl(props)}</div>
      <Carousel
        arrows={false}
        responsive={responsive}
        ref={carouselRef}
        beforeChange={current => {
          handleTabChange(undefined, stateRef.current.tabValueMap[current]);
        }}
      >
        {children(props)}
      </Carousel>
    </Box>
  );
};

Tabs.propTypes = {};

export default Tabs;
