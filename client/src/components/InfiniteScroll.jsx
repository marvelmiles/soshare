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
import { isOverflowing } from "utils/validators";
import DataNotifier from "components/DataNotifier";
import { addToSet } from "utils";
import { isObject } from "utils/validators";

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
      defaultShowEnd = false,
      endElement,
      notifierDuration = 30000,
      notifierDelay = 500,
      Component,
      componentProps,
      httpConfig,
      dataKey,
      withCredentials = true,
      maxSize,
      maxSizeElement,
      limit = 1,
      scrollNodeRef,
      withError = true,
      searchId,
      randomize,
      nodeKey,
      validatePublicDatum,
      withIntersection = false,
      NotifierComponent = DataNotifier,
      exclude,
      className,
      withShowRetry
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
    const [notifier, setNotifier] = useState({
      data: [],
      open: false
    });
    const containerRef = useRef();
    const { setSnackBar } = useContext();
    const stateRef = useRef({
      intersection: intersectionProp
        ? undefined
        : {
            root: scrollNodeRef === null ? null : scrollNodeRef || containerRef,
            threshold: 0.3,
            nodeKey
          },
      infinitePaging: {},
      prevNotice: [],
      retryCount: 0,
      maxRetry: 10
    });
    const { intersectionKey } = useViewIntersection(
      observedNode,
      stateRef.current.intersection || intersectionProp
    );

    const reachedMax = useMemo(() => data.data.length === maxSize, [
      data.data.length,
      maxSize
    ]);

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

    const closeNotifier = useCallback((resetDelay = 500, e) => {
      e && e.stopPropagation();
      setNotifier(notifier => ({
        ...notifier,
        open: false
      }));
      let timerId = setTimeout(() => {
        if (timerId) clearTimeout(timerId);
        setNotifier(notifier => ({ ...notifier, data: [] }));
      }, resetDelay);
    }, []);

    const fetchData = useCallback(
      retry => {
        setData(data => {
          const dataChanged = intersectionKey !== data.paging?.nextCursor;
          const infinitePaging = stateRef.current.infinitePaging;
          const shouldSearch =
            searchId && searchId !== stateRef.current.searchId;
          const shouldFetch =
            retry ||
            (!stateRef.current.isFetching &&
              !stateRef.current.preventFetch &&
              !reachedMax &&
              (withIntersection || shouldSearch
                ? true
                : infinitePaging.matchedDocs
                ? data.data.length < infinitePaging.matchedDocs &&
                  intersectionKey
                : data.paging?.nextCursor === undefined ||
                  (intersectionKey && data.paging.nextCursor !== null)));
          if (retry) stateRef.current.retryCount++;
          if (shouldFetch) {
            setLoading(true);
            let withFetch = true;
            let withEq = true;
            let _randomize =
              randomize === undefined ? !intersectionKey : !!randomize;
            let _limit = limit;

            if (shouldSearch) {
              stateRef.current.searchId = searchId;
              const index = data.data.findIndex(
                d => d.id === searchId || d === searchId
              );
              if (index === -1) {
                _randomize = true;
                withEq = true;
                data.data = [];
                delete data.paging;
              } else {
                data.data = data.data
                  .slice(index)
                  .filter(
                    item =>
                      new Date(item.createdAt).getTime() <=
                      new Date(data.data[index].createdAt).getTime()
                  );

                if (intersectionKey) {
                  _randomize = false;
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

                handleAction &&
                  handleAction("data", {
                    currentData: data,
                    shallowUpdate: true,
                    dataSize: data.data.length
                  });
              }
            }
            if (withFetch) {
              (async () => {
                try {
                  stateRef.current.isFetching = true;

                  const _url =
                    url +
                    `?limit=${_limit || ""}&cursor=${data.paging?.nextCursor ||
                      ""}&withEq=${withEq}&randomize=${_randomize}&exclude=${(
                      exclude || []
                    )
                      .concat(data.data || [])
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

                  if (isObject(_data)) {
                    if (_data.paging) {
                      if (_data.paging.matchedDocs) {
                        infinitePaging.withMatchedCursor =
                          _data.paging.nextCursor;
                        infinitePaging.matchedDocs = _data.paging.matchedDocs;
                      }
                    } else {
                      stateRef.current.retryCount++;
                      setShowRetry(true);
                    }

                    handleAction &&
                      handleAction("data", {
                        currentData: _data,
                        shallowUpdate: false,
                        dataSize: _data.data.length
                      });
                    // console.log(
                    //   data.data.map(c => {
                    //     if (c.threads)
                    //       console.log(
                    //         c.threads.map(c => c.id || c),
                    //         " threads"
                    //       );
                    //     return c.id || c;
                    //   })
                    // );
                    setData(data => ({
                      ..._data,
                      data: data.data.concat(addToSet(_data.data))
                    }));
                  } else {
                    stateRef.current.retryCount++;
                    setShowRetry(true);
                  }
                } catch (msg) {
                  console.log(msg, " msg ");
                  if (
                    stateRef.current.retryCount < stateRef.current.maxRetry &&
                    (withShowRetry !== undefined
                      ? withShowRetry
                      : stateRef.current.withShowRetry)
                  ) {
                    stateRef.current.retryCount++;
                    setShowRetry(true);
                  } else stateRef.current.preventFetch = true;

                  (withCredentials || withError) && setSnackBar(msg);
                } finally {
                  stateRef.current.isFetching = false;
                  setLoading(false);
                }
              })();
            }
          }
          if (withCredentials === false) {
            // get only public data during session timeout
            // or user isn't logged in
            data.data = data.data.filter(
              typeof validatePublicDatum === "function"
                ? validatePublicDatum
                : item =>
                    item.visibility ? item.visibility === "everyone" : true
            );
          }
          return dataChanged ? { ...data } : data;
        });
      },
      [
        url,
        withCredentials,
        httpConfig,
        dataKey,
        limit,
        searchParams,
        intersectionKey,
        withIntersection,
        searchId,
        validatePublicDatum,
        setSnackBar,
        handleAction,
        reachedMax,
        randomize,
        exclude,
        withError,
        withShowRetry
      ]
    );

    const propMemo = useMemo(
      () => ({
        data,
        closeNotifier,
        fetchData,
        data,
        loading,
        reachedMax,
        willRefetch: !!(data.data.length && data.paging?.nextCursor),
        dataChanged: stateRef.current.dataChanged,
        isNewData: stateRef.current.isNewData,
        infinitePaging: stateRef.current.infinitePaging,
        setLoading,
        setObservedNode: (nodeOrFunc, strictMode = true, context = {}) => {
          if (strictMode ? nodeOrFunc && stateRef.current.dataChanged : true) {
            stateRef.current.withShowRetry = context.withShowRetry;
            stateRef.current.intersection = context.intersectionProps;
            setObservedNode(nodeOrFunc);
            determineFlowing();
          }
        },
        setData: (prop, numberOfEntries, preventFetch) => {
          const handleNotice = _data => {
            numberOfEntries =
              numberOfEntries === undefined
                ? _data.length > data.data.length
                  ? 1
                  : 0
                : numberOfEntries;
            if (_data.length && numberOfEntries && notifierDelay > -1) {
              if (stateRef.current.dataNoticeStartTaskId) {
                clearTimeout(stateRef.current.dataNoticeStartTaskId);
                clearTimeout(stateRef.current.dataNoticeEndTaskId);
              }
              stateRef.current.prevNotice = _data
                .slice(0, numberOfEntries)
                .concat(stateRef.current.prevNotice || []);
              stateRef.current.dataNoticeStartTaskId = setTimeout(() => {
                setNotifier(notifier => ({
                  ...notifier,
                  data: stateRef.current.prevNotice,
                  open: true
                }));
                stateRef.current.prevNotice = [];

                stateRef.current.dataNoticeEndTaskId = setTimeout(() => {
                  setNotifier(notifier => ({
                    ...notifier,
                    open: false
                  }));
                }, notifierDuration);
              }, notifierDelay);
            } else
              setNotifier(notifier => ({
                ...notifier,
                open: false
              }));
          };
          const setState = dataSize => {
            if (dataSize < data.data.length)
              stateRef.current.preventLoading = true;
            else stateRef.current.preventLoading = false;
            stateRef.current.preventFetch = preventFetch;
          };
          if (typeof prop === "function") {
            setData(prev => {
              const data = prop(prev);
              if (data.data.length) handleNotice(data.data);
              else {
                setShowEnd(false);
                setObservedNode(null);
              }
              setState(data.data.length);
              return data;
            });
          } else {
            if (prop.data.length) handleNotice(prop.data);
            else {
              setShowEnd(false);
              setObservedNode(null);
            }
            setState(prop.data.length);
            setData(prop);
          }
        },
        setObservedNode: (nodeOrFunc, withDataChanged = true) => {
          if (
            withDataChanged ? nodeOrFunc && stateRef.current.dataChanged : true
          ) {
            setObservedNode(nodeOrFunc);
            determineFlowing();
          }
        }
      }),
      [
        data,
        determineFlowing,
        closeNotifier,
        fetchData,
        loading,
        notifierDelay,
        notifierDuration,
        reachedMax
      ]
    );

    const nullifyChildren =
      stateRef.current.readyState === "pending" ||
      data.paging?.nextCursor === undefined;

    const isEnd =
      data.paging?.nextCursor === null &&
      data.data.length &&
      !loading &&
      (stateRef.current.infinitePaging.matchedDocs
        ? data.data.length >= stateRef.current.infinitePaging.matchedDocs
        : true);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    useEffect(() => {
      if (ref) {
        propMemo.container = containerRef.current;
        ref.current = propMemo;
      }
    }, [propMemo, ref]);

    const handleRefetch = e => {
      e.stopPropagation();
      fetchData(true);
    };

    endElement = isEnd
      ? endElement || (
          <Typography
            color="primary.main"
            variant="h6"
            sx={{
              my: 2
            }}
            textAlign="center"
          >
            looks like you have reached the end!
          </Typography>
        )
      : null;
    const fullHeight = nullifyChildren || !data.data.length;
    return (
      <Box
        key={url}
        className={`data-scrollable ${className}`}
        sx={{
          position: "relative",
          overflow: "hidden",
          height: "inherit",
          minHeight: "inherit",
          display: "flex",
          flexDirection: "column",
          ...sx
        }}
      >
        {data.data.length}
        <Box
          ref={containerRef}
          component={Component}
          {...componentProps}
          sx={{
            display: "flex",
            minHeight: "inherit",
            height: "inherit",
            flex: "inherit",
            flexDirection: "column"
          }}
          className="data-scrollable-container"
        >
          {notifierDelay > -1 ? (
            <NotifierComponent
              containerRef={
                scrollNodeRef === undefined ? containerRef : scrollNodeRef
              }
              open={notifier.open}
              data={notifier.data}
              message={notifier.message}
              closeNotifier={closeNotifier}
            />
          ) : null}
          <Box
            className="data-scrollable-content-container"
            sx={{
              "&,.data-scrollable-content": {
                display: "flex",
                flexDirection: "column",
                justifyContent: fullHeight ? "center" : "normal",
                flex: 1
                // border: "1px solid red"
              }
            }}
          >
            <Box
              className="data-scrollable-content"
              style={{
                flex: "none"
              }}
            >
              {stateRef.current.retryCount === stateRef.current.maxRetry ? (
                <EmptyData nullifyBrand withReload onClick={handleRefetch} />
              ) : showRetry && !data.data.length ? (
                <EmptyData
                  sx={{
                    p: 3
                  }}
                  onClick={handleRefetch}
                />
              ) : nullifyChildren ? null : (
                children({
                  ...propMemo
                  // data: {
                  //   data: [data.data[0]],
                  //   paging: { nextCursor: null }
                  // }
                })
              )}
            </Box>
            {loading && !stateRef.current.preventLoading ? (
              <Loading
                className={
                  data.data.length ? "custom-more-loading" : "custom-loading"
                }
              />
            ) : showRetry && data.data.length ? (
              <EmptyData
                sx={{
                  height: "120px",
                  minHeight: "120px"
                }}
                onClick={handleRefetch}
              />
            ) : null}
          </Box>
          {reachedMax ? maxSizeElement : isEnd && showEnd ? endElement : null}
        </Box>
      </Box>
    );
  }
);

InfiniteScroll.propTypes = {};

export default InfiniteScroll;
