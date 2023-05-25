import React from "react";
import PropTypes from "prop-types";
import MainView from "views/MainView";
import ShortsView from "views/ShortsView";

const ShortsPage = props => {
  return (
    <MainView sideView={undefined}>
      <ShortsView
        loop
        key="shorts-page"
        plainWidget
        miniShort={false}
        sx={{
          maxWidth: "450px"
        }}
        scrollNodeRef={null}
      />
    </MainView>
  );
};

ShortsPage.propTypes = {};

export default ShortsPage;
