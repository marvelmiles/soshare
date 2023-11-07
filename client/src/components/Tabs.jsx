import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import MuiTabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Carousel from "react-multi-carousel";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createRelativeURL } from "api/http";
import { useContext } from "context/store";

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
  renderSectionEl,
  onBeforeChange,
  onAfterChange
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") || defaultTab).toLowerCase();

  const { locState } = useContext();

  const carouselRef = useRef();

  const stateRef = useRef({
    tabChanged: false,
    tabIndexMap: {},
    tabValueMap: {},
    defaultTab,
    tab
  });

  useEffect(() => {
    const stateCtx = stateRef.current;
    if (carouselRef.current) {
      stateCtx.tab = tab;

      carouselRef.current.goToSlide(stateCtx.tabIndexMap[tab]);
    }
    return () => {
      stateCtx.withEvent = false;
    };
  }, [tab]);

  const handleTabChange = (e, value = tab) => {
    e && e.stopPropagation();

    const search = new URLSearchParams(window.location.search);

    for (const key of `tab ${deleteParams}`.split(" ")) {
      search.delete(key);
    }

    setSearchParams(
      new URLSearchParams(
        `tab=${value}${newParams ? `&${newParams}` : ""}&${search.toString()}`
      ),
      {
        replace: true,
        state: locState
      }
    );
  };

  const props = {
    tab,
    tabChanged: tab !== stateRef.current.tab,
    defaultValue: locState[tab] || ""
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
      <div>{renderSectionEl && renderSectionEl(props)}</div>
      <Carousel
        arrows={false}
        responsive={responsive}
        ref={carouselRef}
        afterChange={(prevSlide, { currentSlide }) => {
          onAfterChange &&
            onAfterChange(stateRef.current.tabValueMap[currentSlide]);
        }}
        beforeChange={current => {
          const _tab = stateRef.current.tabValueMap[current];
          onBeforeChange && onBeforeChange(stateRef.current.tab);
          handleTabChange(undefined, _tab);
        }}
      >
        {children(props)}
      </Carousel>
    </Box>
  );
};

Tabs.propTypes = {};

export default Tabs;
