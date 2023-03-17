import React from "react";
import PropTypes from "prop-types";

const ScrollGridLocator = ({ Component, ...props }) => {
  return <Component {...props}></Component>;
};

ScrollGridLocator.propTypes = {};

export default ScrollGridLocator;
