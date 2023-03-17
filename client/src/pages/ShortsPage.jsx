import React, { useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import MainView from "views/MainView";
import ShortsWidget from "components/ShortsWidget";

const ShortsPage = props => {
  return (
    <MainView publicView="posts">
      <ShortsWidget
        key="shorts-page"
        plainWidget
        miniShort={false}
        sx={{
          maxWidth: "450px"
        }}
        loop
      />
    </MainView>
  );
};

ShortsPage.propTypes = {};

export default ShortsPage;
