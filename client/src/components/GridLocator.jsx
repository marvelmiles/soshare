import React, { useEffect, useRef, Children } from "react";
import PropTypes from "prop-types";
import { getScrollAtIndexes } from "utils";
import { debounce } from "@mui/material";
const GridLocator = ({
  children,
  viewContainer,
  onScrollAt,
  delay = 1000,
  enableReelEffect = false
}) => {
  const stateRef = useRef({});
  useEffect(() => {
    let child;
    console.log(children);
    const onScroll = e => {
      // const childrenHeight = (t || e).firstElementChild.clientHeight;
      // const j = t.childNodes[0]?.nextElementSibling;
      // const n = j?.getBoundingClientRect();
      // const rect = (t || e).firstElementChild.getBoundingClientRect();
      // const h = document.documentElement;
      // const contBot = h.offsetTop + h.clientHeight;
      // const eTop = n.top;
      // const eBot = eTop + n?.height - 40;
      // console.log(eBot, eTop, contBot);
    };
    window.addEventListener("scroll", debounce(onScroll, delay), false);
    return () => {};
  }, [viewContainer, onScrollAt, delay, enableReelEffect, children]);
  return <>{children}</>;
};

GridLocator.propTypes = {};

export default GridLocator;
