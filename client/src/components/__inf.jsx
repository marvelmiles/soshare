import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback
} from "react";
import PropTypes from "prop-types";
import useViewIntersection from "hooks/useViewIntersection";
import { useContext } from "context/store";
import http from "api/http";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Loading from "components/Loading";
import EmptyData from "components/EmptyData";
import NorthIcon from "@mui/icons-material/North";
import Button from "@mui/material/Button";
import AvatarGroup from "@mui/material/AvatarGroup";
import Avatar from "@mui/material/Avatar";
import ReactDom from "react-dom";
import { isOverflowing, isDOMElement } from "utils/validators";
import { Link } from "react-router-dom";
import { debounce } from "@mui/material";

Avatar.defaultProps = {
  sx: {
    width: 25,
    height: 25,
    fontSize: "12px"
  }
};

const InfiniteScroll = React.forwardRef(
  (
    {
      children,
      intersectionProp,
      readyState = "ready",
      url,
      sx,
      searchParams = "",
      handleAction,
      defaultData,
      defaultShowEnd = true,
      endElement,
      noticeDuration = 30000,
      noticeDelay = 500,
      verify,
      Component,
      componentProps,
      httpConfig,
      dataKey,
      fullHeight = true,
      withCredentials = true,
      maxSize,
      maxSizeElement,
      limit = 1,
      scrollNodeRef,
      withError,
      searchId,
      randomize = true,
      nodeKey,
      validatePublicDatum,
      withIntersection = false
    },
    ref
  ) => {
    const [data, setData] = useState({
      data: [],
      ...defaultData
    });
    const [observedNode, setObservedNode] = useState(null);
    const [showRetry, setShowRetry] = useState(false);
    const [loading, setLoading] = useState(readyState !== "ready");
    const [showEnd, setShowEnd] = useState(defaultShowEnd);
    const containerRef = useRef();
    const stateRef = useRef({
      intersection: intersectionProp
        ? undefined
        : {
            root: scrollNodeRef === null ? null : scrollNodeRef || containerRef,
            verify,
            threshold: 0.3,
            nodeKey
          },
      infinitePaging: {}
    });
    const { intersectionKey } = useViewIntersection(
      observedNode,
      stateRef.current.intersection || intersectionProp
    );
    const determineFlowing = useCallback(() => {
      setShowEnd(() => {
        return isOverflowing(
          scrollNodeRef === null
            ? document.documentElement
            : scrollNodeRef
            ? scrollNodeRef.current
            : containerRef.current
        );
      });
    }, [scrollNodeRef]);
    const reachedMax = false;
    const propMemo = useMemo(
      () => ({
        data,
        setObservedNode: (nodeOrFunc, withDataChanged = true, controlled) => {
          controlled = !!(controlled || stateRef.current.nodekey);
          if (
            withDataChanged ? nodeOrFunc && stateRef.current.dataChanged : true
          ) {
            setObservedNode(nodeOrFunc);
            determineFlowing();
          }
        }
      }),
      [data, determineFlowing]
    );

    const nullifyChildren =
      stateRef.current.readyState === "pending" ||
      data.paging?.nextCursor === undefined;

    const fetchData = useCallback(() => {
      if (!verify && false) return;
      setData(data => {
        const dataChanged = true;
        stateRef.current.dataChanged = false;
        const infinitePaging = stateRef.current.infinitePaging;

        const shouldSearch = searchId && searchId !== stateRef.current.searchId;
        const shouldFetch =
          !stateRef.current.isFetching &&
          (withIntersection || shouldSearch
            ? true
            : infinitePaging.matchedDocs
            ? data.data.length < infinitePaging.matchedDocs && intersectionKey
            : data.paging?.nextCursor === undefined || intersectionKey);

        searchId &&
          console.log(
            shouldFetch,
            stateRef.current,
            intersectionKey,
            shouldSearch,
            data.data.length,
            " fetcher ",
            stateRef.current.isFetching,
            data.data.length < infinitePaging.matchedDocs,
            intersectionKey
          );

        if (shouldFetch) {
          setLoading(true);
          let withFetch = true;
          let withEq = true;
          let randomize = !intersectionKey;
          let _limit = limit;

          if (shouldSearch) {
            console.log(" with search ");
            stateRef.current.searchId = searchId;
            const index = data.data.findIndex(
              d => d.id === searchId || d === searchId
            );
            if (index === -1) {
              randomize = true;
              withEq = true;
              data.data = [];
              delete data.paging;
            } else {
              console.log(" found ");
              data.data = data.data
                .slice(index)
                .filter(
                  item =>
                    new Date(item.createdAt).getTime() <=
                    new Date(data.data[index].createdAt).getTime()
                );

              if (intersectionKey) {
                randomize = false;
                withEq = false;
              }

              if (
                (data.paging.nextCursor
                  ? false
                  : infinitePaging.matchedDocs
                  ? data.data.length === infinitePaging.matchedDocs
                  : true) ||
                (_limit =
                  data.data.length > _limit
                    ? _limit || Infinity
                    : _limit > data.data.length
                    ? _limit - data.data.length
                    : _limit) === 0
              ) {
                data.paging.nextCursor = null;
                withFetch = false;
              } else {
                data.paging.nextCursor = data.data[data.data.length - 1].id;
                withFetch = intersectionKey;
              }
            }
          }
          if (withFetch) {
            (async () => {
              try {
                stateRef.current.isFetching = true;
                const _url =
                  url +
                  `?limit=${_limit || ""}&cursor=${data.paging?.nextCursor ||
                    ""}&withEq=${withEq}&randomize=${randomize}&exclude=${data.data
                    .map(d => d.id || d._id || d)
                    .join(",")}&${
                    searchParams
                      ? searchParams
                      : dataKey
                      ? `select=${dataKey}`
                      : ""
                  }`;
                let _data = await http.get(_url, {
                  withCredentials,
                  ...httpConfig
                });
                stateRef.current.dataChanged =
                  !data.paging?.nextCursor ||
                  data.paging.nextCursor !== _data.paging.nextCursor ||
                  data.data.length !== _data.data.length;

                stateRef.current.isNewData = stateRef.current.dataChanged;
                if (_data.paging.matchedDocs) {
                  infinitePaging.withMatchedCursor = _data.paging.nextCursor;
                  infinitePaging.matchedDocs = _data.paging.matchedDocs;
                }
                data = {
                  ..._data,
                  data: data.data.concat(_data.data)
                };
                setData(data);
              } catch (msg) {
              } finally {
                console.log(" hmm kkk ");
                stateRef.current.isFetching = false;
                setLoading(false);
              }
            })();
          }
        }
        return dataChanged ? { ...data } : data;
      });
    }, [
      url,
      withCredentials,
      httpConfig,
      verify,
      dataKey,
      limit,
      searchParams,
      intersectionKey,
      withIntersection,
      searchId
    ]);

    const isEnd =
      data.paging?.nextCursor === null &&
      !loading &&
      (stateRef.current.infinitePaging.matchedDocs
        ? data.data.length >= stateRef.current.infinitePaging.matchedDocs
        : true);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    endElement = isEnd
      ? endElement || (
          <Typography
            color="primary.dark"
            variant="h6"
            sx={{ mb: 2 }}
            textAlign="center"
          >
            looks like you have reached the end!
          </Typography>
        )
      : null;
    return (
      <Box
        key={url}
        className="data-scrollable"
        sx={
          fullHeight
            ? {
                height: "inherit",
                minHeight: "inherit",
                ...sx
              }
            : sx
        }
      >
        {data.data.length}
        <Box
          ref={containerRef}
          sx={
            fullHeight
              ? {
                  minHeight: "inherit",
                  height: "inherit"
                }
              : undefined
          }
          component={Component}
          {...componentProps}
          className="data-scrollable-container"
        >
          <div
            style={
              nullifyChildren
                ? {
                    height: "inherit",
                    minHeight: "inherit"
                  }
                : undefined
            }
          >
            {showRetry && !data.data.length ? (
              <EmptyData
                sx={{
                  p: 3
                }}
                onClick={e => {
                  e.stopPropagation();
                }}
              />
            ) : nullifyChildren ? null : (
              children(propMemo)
            )}
            {loading ? (
              <Loading />
            ) : showRetry && data.data.length ? (
              <EmptyData
                sx={{
                  height: "120px",
                  minHeight: "120px"
                }}
                onClick={e => {
                  e.stopPropagation();
                }}
              />
            ) : null}
          </div>
          {reachedMax ? maxSizeElement : isEnd && showEnd ? endElement : null}
        </Box>
      </Box>
    );
  }
);

InfiniteScroll.propTypes = {};

export default InfiniteScroll;
