import React from "react";
import PropTypes from "prop-types";
import MainView from "views/MainView";
import ShortsView from "views/ShortsView";

const ShortsPage = () => {
  return (
    <MainView sideView="">
      <ShortsView
        loop
        key="shorts-page"
        plainWidget
        miniShort={false}
        scrollNodeRef={null}
      />
    </MainView>
  );
};

ShortsPage.propTypes = {};

export default ShortsPage;
