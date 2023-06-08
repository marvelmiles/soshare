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
      limit = 20,
      scrollNodeRef,
      withError = true,
      searchId,
      randomize,
      nodeKey,
      validatePublicDatum,
      NotifierComponent = DataNotifier,
      exclude,
      className = "",
      withShowRetry = true,
      verify,
      notifierProps,
      centerOnEmpty = true,
      contentSx,
      withOverflowShowEndOnly = true,
      withOverflowShowNotifierOnly = true,
      excludeSep = ","
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
      exclude: { ...exclude },
      infinitePaging: {},
      prevNotice: [],
      retryCount: 0,
      maxRetry: 10,
      sep: excludeSep
    });
    const { intersectionKey } = useViewIntersection(
      observedNode,
      stateRef.current.intersection || intersectionProp,
      verify
    );
    const reachedMax = useMemo(() => data.data.length === maxSize, [
      data.data.length,
      maxSize
    ]);

    const determineFlowing = useCallback(() => {
      withOverflowShowEndOnly &&
        setShowEnd(() => {
          return isOverflowing(
            scrollNodeRef === null
              ? document.documentElement
              : scrollNodeRef
              ? scrollNodeRef.current
              : containerRef.current
          );
        });
    }, [scrollNodeRef, withOverflowShowEndOnly]);

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
          if (readyState !== "ready") return data;
          const dataChanged = intersectionKey !== data.paging?.nextCursor;
          const infinitePaging = stateRef.current.infinitePaging;
          const shouldSearch =
            searchId && searchId !== stateRef.current.searchId;
          const shouldFetch =
            retry ||
            (!stateRef.current.isFetching &&
              !stateRef.current.preventFetch &&
              !reachedMax &&
              (shouldSearch
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
            let _limit = limit,
              defaultCursor = "",
              withMatchedDocs = "";

            if (shouldSearch) {
              stateRef.current.searchId = searchId;
              const index = data.data.findIndex(
                d => d.id === searchId || d === searchId
              );
              if (index === -1) {
                withMatchedDocs = true;
                _randomize = false;
                withEq = true;
                data.data = [];
                defaultCursor = searchId;
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
                stateRef.current.shallowUpdate = true;
              }
            }

            if (withFetch) {
              (async () => {
                try {
                  stateRef.current.isFetching = true;
                  const exclude = stateRef.current.exclude;
                  const isEString = typeof exclude === "string";
                  const sep = stateRef.current.sep;

                  const _url =
                    url +
                    `?limit=${_limit || ""}&cursor=${data.paging?.nextCursor ||
                      defaultCursor}&withEq=${withEq}&randomize=${false}&withMatchedDocs=${withMatchedDocs}&exclude=${
                      exclude
                        ? isEString
                          ? `${data.data.length ? sep : ""}${exclude}`
                          : (() => {
                              let str = "";
                              for (const key in exclude) {
                                str += `${
                                  str.length || data.data.length ? sep : ""
                                }${key}`;
                              }
                              return str;
                            })()
                        : ""
                    }&${
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

                  dataKey && (_data = _data[dataKey]);

                  stateRef.current.dataChanged =
                    !data.paging?.nextCursor ||
                    data.paging.nextCursor !== _data.paging.nextCursor ||
                    data.data.length !== _data.data.length;

                  if (isObject(_data)) {
                    if (
                      _data.paging.nextCursor !== undefined &&
                      Array.isArray(_data.data)
                    ) {
                      if (_data.paging.matchedDocs) {
                        infinitePaging.withMatchedCursor =
                          _data.paging.nextCursor;
                        infinitePaging.matchedDocs = _data.paging.matchedDocs;
                      }
                    } else return;
                    let isProc = false;
                    setData(data => {
                      if (isProc) return _data;
                      isProc = true;
                      const set = exclude
                        ? isEString
                          ? (() => {
                              const set = {};
                              exclude.split(sep).forEach(item => {
                                return (set[
                                  item.id || item._id || JSON.stringify(item)
                                ] = true);
                              });

                              return set;
                            })()
                          : exclude
                        : undefined;
                      _data = {
                        ..._data,
                        data: data.data.concat(
                          addToSet(_data.data, undefined, set)
                        )
                      };
                      stateRef.current.exclude = set;
                      stateRef.current.shallowUpdate = false;
                      // const _d = (() => {
                      //   const y = [];
                      //   for (let i = 0; i < 50; i++) {
                      //     const v = currentData.data[0];
                      //     const f = {
                      //       ...v
                      //     };
                      //     f.threads = [v, v, v, v, v, v, v];
                      //     y.push(f);
                      //   }

                      //   return y;
                      // })();
                      // _d[25].id = "12345";

                      // console.log(_d);
                      // console.log("with dtaa ")
                      // console.log(_data);
                      return _data;
                    });
                  }
                } catch (msg) {
                  console.log(
                    msg,
                    verify,
                    withShowRetry,
                    stateRef.current,
                    " msg "
                  );
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
        readyState,
        url,
        withCredentials,
        httpConfig,
        dataKey,
        limit,
        searchParams,
        intersectionKey,
        searchId,
        validatePublicDatum,
        setSnackBar,
        reachedMax,
        randomize,
        withError,
        withShowRetry,
        verify
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
        setLoading,
        willRefetch: !!(data.data.length && data.paging?.nextCursor),
        dataChanged: stateRef.current.dataChanged,
        infinitePaging: stateRef.current.infinitePaging,
        shallowUpdate: stateRef.current.shallowUpdate,
        setObservedNode: (nodeOrFunc, strictMode = true, context = {}) => {
          if (strictMode ? nodeOrFunc && stateRef.current.dataChanged : true) {
            stateRef.current.withShowRetry = context.withShowRetry;
            if (context.intersectionProps)
              stateRef.current.intersection = {
                ...stateRef.current.intersection,
                ...context.intersectionProps
              };
            setObservedNode(nodeOrFunc);
            determineFlowing();
          }
        },
        setData: (prop, options = {}) => {
          let {
            numberOfEntries,
            preventFetch,
            preventLoading,
            withStateDeterminant = true,
            exclude
          } = options;

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
          const setState = _data => {
            const dataSize = _data.data.length;
            if (withStateDeterminant && dataSize < data.data.length) {
              const size = stateRef.current.infinitePaging?.matchedDocs;
              size &&
                (stateRef.current.infinitePaging.matchedDocs = dataSize
                  ? size - (data.data.length - dataSize)
                  : 0);
            }

            stateRef.current.preventFetch = preventFetch;
            stateRef.current.preventLoading = preventLoading;
            stateRef.current.dataChanged = dataSize !== data.data.length;

            exclude && (stateRef.current.exclude = exclude);

            stateRef.current.shallowUpdate = true;
          };
          if (typeof prop === "function") {
            setData(prev => {
              const data = prop(prev);
              if (data.data.length) handleNotice(data.data);
              else {
                setShowEnd(false);
                setObservedNode(null);
              }
              setState(data, prev);
              return data;
            });
          } else {
            if (prop.data.length) handleNotice(prop.data);
            else {
              setShowEnd(false);
              setObservedNode(null);
            }
            setState(prop);
            setData(prop);
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

    useEffect(() => {
      handleAction &&
        stateRef.current.dataChanged &&
        handleAction("data", {
          currentData: data,
          dataSize: data.data.length,
          shallowUpdate: stateRef.current.shallowUpdate
        });
    }, [handleAction, data]);

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
    const fullHeight =
      nullifyChildren || (data.data.length ? false : centerOnEmpty);

    return (
      <Box
        key={url}
        className={`data-scrollable ${className}`}
        ref={containerRef}
        component={Component}
        {...componentProps}
        sx={{
          // border: "1px solid green",
          // height: "inherit",
          // minHeight: "inherit",
          position: "relative",
          overflow: "hidden",
          flex: 1,
          "&,.data-scrollable-content": {
            display: "flex",
            flexDirection: "column",
            justifyContent: fullHeight ? "center" : "normal",
            flexDirection: "column"
          },
          ...sx
        }}
      >
        {/* {data.data.length} */}
        {notifierDelay > -1 &&
        (withOverflowShowNotifierOnly ? showEnd : true) ? (
          <NotifierComponent
            containerRef={
              scrollNodeRef === undefined ? containerRef : scrollNodeRef
            }
            {...notifierProps}
            open={notifier.open}
            data={notifier.data}
            message={notifier.message}
            closeNotifier={closeNotifier}
          />
        ) : null}

        <div
          className="data-scrollable-content"
          style={{
            flex: "none",
            // border: "1px solid yellow",
            ...contentSx
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
              //   ...data,
              //   data: (() => {
              //     const arr = [];
              //     for (let i = 0; i < 40; i++) {
              //       arr.push(data.data[i] || data.data[0]);
              //     }
              //     return arr;
              //   })()
              // }
            })
          )}
        </div>
        <div>
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
          {reachedMax
            ? maxSizeElement
            : isEnd && (withOverflowShowEndOnly ? showEnd : true)
            ? endElement
            : null}
        </div>
      </Box>
    );
  }
);

InfiniteScroll.propTypes = {};

export default InfiniteScroll;
