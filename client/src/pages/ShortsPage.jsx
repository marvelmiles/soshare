import React from "react";
import PropTypes from "prop-types";
import MainView from "views/MainView";
import ShortsView from "views/ShortsView";
import useDevice from "hooks/useDevice";

const ShortsPage = () => {
  const { deviceWidth } = useDevice();

  return (
    <>
      <MainView sideView="" layoutProps={{ bottom: deviceWidth < 768 }}>
        <ShortsView
          loop
          key="shorts-page"
          plainWidget
          miniShort={false}
          scrollNodeRef={null}
          mx="auto"
        />
      </MainView>
    </>
  );
};

ShortsPage.propTypes = {};

export default ShortsPage;
