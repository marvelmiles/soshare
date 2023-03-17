import { useEffect, useState, useRef } from "react";
import useViewIntersection from "hooks/useViewIntersection";
import http from "api/http";
import { useContext } from "redux/store";
const useInfiniteScroll = ({
  observedNode,
  url,
  intersectionProp,
  autoFetch
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const { setSnackBar } = useContext();
  const stateRef = useRef({
    intersection: intersectionProp
  }).current;
  const { isIntersecting } = useViewIntersection(
    observedNode,
    stateRef.intersection
  );
  useEffect(() => {
    if (
      stateRef.paging
        ? isIntersecting && stateRef.paging.nextCursor
        : !stateRef.initFetch && autoFetch
    ) {
      stateRef.initFetch = true;
      (async () => {
        isIntersecting && console.log("once...", stateRef.paging.nextCursor);
        try {
          setLoading(true);
          const { data, paging } = await http.get(
            url + `?limit=5&cursor=${stateRef.paging ?.nextCursor || ""}`,
            {
              withCredentials: true
            }
          );
          stateRef.paging = paging;
          setData(prev => {
            return data.concat(prev);
          });
        } catch (message) {
          setSnackBar(message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [url, stateRef, stateRef.paging, isIntersecting, autoFetch, setSnackBar]);
  return { data: { data }, loading, setData };
};

export default useInfiniteScroll;

import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { getScrollAtIndexes } from "utils";
import { debounce } from "@mui/material";
const useGridLocator = ({
  gridRef,
  delay = 1000,
  gap = 0,
  enableReelEffect = false,
  root,
  excludePartialView
}) => {
  const stateRef = useRef({
    index: 0
  });
  const [state, setState] = useState({
    scrollAtIndex: 0
  });
  useEffect(() => {
    const onScroll = e => {
      const cont =
        root === "window"
          ? document.documentElement || {
              offsetTop: window.pageYOffset || window.scrollY,
              clientHeight: window.innerHeight,
              scrollTop: window.scrollY
            }
          : gridRef;
      // if (cont.scrollTop < 20)
      //   return setState(prev => ({
      //     ...prev,
      //     initItems: 0,
      //     scrollAtIndex: 0
      //   }));
      const mvBack = stateRef.current.scrollTop > cont.scrollTop;
      const v = gridRef.current.childNodes[stateRef.current.index];
      const o =
        gridRef.current.childNodes[stateRef.current.index + 1].clientHeight;
      let index = stateRef.current.index || 0;
      if (mvBack) {
        const rect = v.getBoundingClientRect();
        console.log(
          stateRef.current.index,
          rect.top + rect.height / 2,
          cont.offsetTop + cont.clientHeight
        );
      } else {
        const g = gridRef.current;
        const n = g.getBoundingClientRect();
        index = Math.floor((cont.clientHeight - n.top) / o);
        console.log(index, n.top);
        index = index > 0 ? index - 1 : 0;
        // if (excludePartialView || true) {
        //   const rect = g.childNodes[index].getBoundingClientRect();
        //   const rTop = rect.top;
        //   const nBot = rTop + rect.height;
        //   const contBot = cont.offsetTop + cont.clientHeight;
        //   if (nBot > contBot) index = index > 0 ? index - 1 : 0;
        // }
      }
      stateRef.current.index = index;
      setState(prev => ({
        ...prev,
        scrollAtIndex: index
      }));
      stateRef.current.scrollTop = cont.scrollTop;
    };
    (root === "window" ? window : root).addEventListener(
      "scroll",
      debounce(onScroll, delay),
      false
    );
    return () => {};
  }, [gridRef, root, delay, enableReelEffect, excludePartialView, gap]);
  console.log(state);
  return state;
};

useGridLocator.propTypes = {};

export default useGridLocator;
