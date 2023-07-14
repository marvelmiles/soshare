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
      notifierDelay = 5000,
      Component,
      componentProps,
      httpConfig,
      dataKey,
      withCredentials,
      maxSize,
      maxSizeElement,
      limit = 20,
      scrollNodeRef,
      searchId,
      randomize,
      nodeKey,
      NotifierComponent = DataNotifier,
      exclude = "",
      className = "",
      withShowRetry = true,
      notifierProps,
      centerOnEmpty = true,
      contentSx,
      withOverflowShowEndOnly = true,
      withOverflowShowNotifierOnly = true,
      excludeSep = ",",
      withMatchedDocs,
      shallowLoading
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
      limit,
      randomize,
      withMatchedDocs,
      withShowRetry,
      intersection: intersectionProp
        ? undefined
        : {
            root: scrollNodeRef === null ? null : scrollNodeRef || containerRef,
            threshold: 0.3,
            nodeKey
          },
      exclude,
      infinitePaging: {},
      prevNotice: [],
      retryCount: 0,
      maxRetry: 10,
      sep: excludeSep,
      withDefaultData: !!defaultData
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

    const fetchData = useCallback(
      (retry, fetchConfig) => {
        setData(data => {
          if (readyState !== "ready") return data;
          const sep = stateRef.current.sep;
          if (fetchConfig)
            stateRef.current = {
              ...stateRef.current,
              ...fetchConfig,
              infinitePaging: {
                ...stateRef.current.infinitePaging,
                ...fetchConfig.infinitePaging
              }
            };

          const infinitePaging = stateRef.current.infinitePaging;
          const shouldSearch =
            searchId && searchId !== stateRef.current.searchId;
          const shouldFetch =
            retry ||
            (!stateRef.current.isFetching &&
              (infinitePaging.matchedDocs === undefined ||
                (!reachedMax &&
                  (shouldSearch
                    ? true
                    : infinitePaging.matchedDocs
                    ? data.data.length < infinitePaging.matchedDocs &&
                      intersectionKey
                    : intersectionKey && data.paging.nextCursor !== null))));
          console.clear();
          console.log(
            shouldFetch,
            { ...stateRef.current },
            { ...data },
            intersectionKey
          );

          if (shouldFetch) {
            let {
              randomize,
              limit,
              withMatchedDocs,
              withShowRetry
            } = stateRef.current;

            setLoading(true);
            let withFetch = true,
              withEq = true,
              defaultCursor = "";

            randomize =
              randomize === undefined ? !intersectionKey : !!randomize;
            withMatchedDocs =
              withMatchedDocs === undefined ? "" : withMatchedDocs;

            if (shouldSearch) {
              stateRef.current.searchId = searchId;
              const index = data.data.findIndex(
                d => d.id === searchId || d === searchId
              );
              if (index === -1) {
                withMatchedDocs = true;
                randomize = false;
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
                  randomize = false;
                  withEq = false;
                }

                if (
                  (data.paging.nextCursor
                    ? false
                    : infinitePaging.matchedDocs
                    ? data.data.length === infinitePaging.matchedDocs
                    : true) ||
                  (limit =
                    data.data.length > limit
                      ? limit || Infinity
                      : limit > data.data.length
                      ? limit - data.data.length
                      : limit) === 0
                ) {
                  data.paging.nextCursor = null;
                  withFetch = false;
                  setLoading(false);
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
                  let _data = await http.get(
                    url +
                      `?limit=${limit}&cursor=${data.paging?.nextCursor ||
                        defaultCursor}&withEq=${withEq}&randomize=${randomize}&withMatchedDocs=${withMatchedDocs}&exclude=${
                        stateRef.current.exclude
                      }&${
                        searchParams
                          ? searchParams
                          : dataKey
                          ? `select=${dataKey}`
                          : ""
                      }`,
                    {
                      withCredentials,
                      ...httpConfig
                    }
                  );

                  dataKey && (_data = _data[dataKey]);

                  stateRef.current.dataChanged =
                    !data.paging?.nextCursor ||
                    data.paging.nextCursor !== _data.paging.nextCursor ||
                    data.data.length !== _data.data.length;

                  if (isObject(_data)) {
                    if (
                      _data.paging?.nextCursor !== undefined &&
                      Array.isArray(_data.data)
                    ) {
                      if (
                        !infinitePaging.matchedDocs &&
                        _data.paging.matchedDocs > -1
                      ) {
                        infinitePaging.withMatchedCursor =
                          _data.paging.nextCursor;
                        infinitePaging.matchedDocs = _data.paging.matchedDocs;
                      }
                    } else return;

                    const exclude = stateRef.current.exclude || "";
                    setData(data => {
                      const set =
                        !stateRef.current.withDefaultData && exclude
                          ? (() => {
                              const set = {};
                              exclude.split(sep).forEach(item => {
                                return (set[item] = true);
                              });
                              return set;
                            })()
                          : {};

                      data = {
                        ..._data,
                        data: stateRef.current.withDefaultData
                          ? addToSet(
                              [..._data.data, ...data.data],
                              undefined,
                              set
                            )
                          : data.data.concat(
                              addToSet(_data.data, undefined, set)
                            )
                      };
                      let e = "";
                      if (set)
                        for (const key in set) {
                          e += `${e.length ? sep + key : key}`;
                        }
                      stateRef.current.exclude = e;
                      stateRef.current.shallowUpdate = false;
                      stateRef.current.withDefaultData = undefined;
                      return data;
                    });
                  }
                } catch (msg) {
                  if (msg) {
                    if (
                      stateRef.current.retryCount < stateRef.current.maxRetry &&
                      (withShowRetry === undefined ? true : withShowRetry)
                    ) {
                      stateRef.current.retryCount++;
                      setShowRetry(true);
                    } else stateRef.current.isFetching = true;
                    window.location.pathname.toLowerCase() !== "/auth/signin" &&
                      setSnackBar(msg);
                  }
                } finally {
                  setLoading(false);
                  stateRef.current.isFetching = false;
                }
              })();
            }
          }

          if (withCredentials ? false : !httpConfig?.withCredentials) {
            const valid = [];
            let e = stateRef.current.exclude;
            for (const item of data.data) {
              if (item.visibility && item.visibility !== "everyone") {
                const id =
                  item.id ||
                  item._id ||
                  (typeof item === "string" ? item : JSON.stringify(item));
                e += `${e.length ? sep + id : id}`;
                continue;
              }
              valid.push(item);
            }
            stateRef.current.exclude = e;
            data.data = valid;
          }
          return { ...data };
        });
      },
      [
        readyState,
        intersectionKey,
        reachedMax,
        searchId,
        searchParams,
        url,
        dataKey,
        withCredentials,
        httpConfig,
        setSnackBar
      ]
    );

    const clearNotifierState = (clearPrev = true) => {
      clearPrev && (stateRef.current.prevNotice = []);
      if (stateRef.current.dataNoticeStartTaskId) {
        clearTimeout(stateRef.current.dataNoticeStartTaskId);
        clearTimeout(stateRef.current.dataNoticeEndTaskId);
      }
    };

    const closeNotifier = useCallback((resetDelay = 500, clearPrev, e) => {
      e && e.stopPropagation();
      clearNotifierState(clearPrev);
      setNotifier(notifier => ({
        ...notifier,
        open: false
      }));
      let timerId = setTimeout(() => {
        setNotifier(notifier => ({ ...notifier, data: [] }));
        if (timerId) clearTimeout(timerId);
      }, resetDelay);
    }, []);

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
        setObservedNode: (nodeOrFunc, strictMode = true) => {
          if (strictMode ? stateRef.current.dataChanged : true) {
            setObservedNode(nodeOrFunc);
            determineFlowing();
          }
        },
        setData: (prop, options = {}) => {
          let {
            numberOfEntries,
            preventFetch,
            withStateDeterminant = true,
            exclude
          } = options;

          let nullify;

          const setPropsAndNotice = prop => {
            const dataSize = prop.data.length;

            //init state
            if (withStateDeterminant && dataSize < data.data.length) {
              const size = stateRef.current.infinitePaging.matchedDocs;
              size &&
                (stateRef.current.infinitePaging.matchedDocs = dataSize
                  ? size - (data.data.length - dataSize)
                  : 0);

              stateRef.current.infinitePaging.matchedDocs === dataSize &&
                !stateRef.current.isFetching &&
                (nullify = true);
            }

            stateRef.current.dataChanged = dataSize !== data.data.length;
            preventFetch !== undefined &&
              (stateRef.current.isFetching = preventFetch);

            exclude !== undefined &&
              (stateRef.current.exclude += `${stateRef.current.sep}${exclude}`);

            stateRef.current.shallowUpdate = true;

            if (nullify && prop.data.paging) prop.data.paging.nextCursor = null;

            // handle new entries and notify
            if (dataSize) {
              const _data = prop.data;
              numberOfEntries =
                numberOfEntries === undefined
                  ? _data.length > data.data.length
                    ? 1
                    : 0
                  : numberOfEntries;

              if (_data.length && numberOfEntries && notifierDelay > -1) {
                clearNotifierState(false);
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
                  stateRef.current.dataNoticeEndTaskId = setTimeout(
                    () => closeNotifier(undefined, false),
                    notifierDuration
                  );
                }, notifierDelay);
              } else closeNotifier(undefined, false);
            } else {
              // no entries
              setShowEnd(false);
              setObservedNode(null);
            }

            return prop;
          };

          if (typeof prop === "function")
            setData(prev => setPropsAndNotice(prop(prev)));
          else setData(setPropsAndNotice(prop));
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
      shallowLoading ||
      stateRef.current.readyState === "pending" ||
      stateRef.current.infinitePaging.matchedDocs === undefined ||
      (data.paging?.nextCursor === undefined && !data.data.length);

    const isEnd =
      data.data.length &&
      !loading &&
      (stateRef.current.infinitePaging.matchedDocs
        ? data.data.length >= stateRef.current.infinitePaging.matchedDocs
        : data.paging?.nextCursor === null);

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

    const shouldRefresh = !loading && !isEnd;

    return (
      <Box
        key={url}
        className={`data-scrollable ${className}`}
        ref={containerRef}
        component={Component}
        {...componentProps}
        sx={{
          height: "inherit",
          minHeight: "inherit",
          position: "relative",
          overflow: "hidden",
          flex: 1,
          width: "100%",
          "&,.data-scrollable-content": {
            display: "flex",
            flexDirection: "column",
            justifyContent: fullHeight ? "center" : "normal",
            flexDirection: "column"
          },
          ...sx
        }}
      >
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
            ...contentSx
          }}
        >
          {shouldRefresh &&
          stateRef.current.retryCount === stateRef.current.maxRetry ? (
            <EmptyData nullifyBrand withReload onClick={handleRefetch} />
          ) : shouldRefresh && showRetry && !data.data.length ? (
            <EmptyData
              sx={{
                p: 3
              }}
              onClick={handleRefetch}
            />
          ) : nullifyChildren ? null : (
            children(propMemo)
          )}
        </div>
        <div>
          {loading || shallowLoading ? (
            <Loading
              className={
                data.data.length ? "custom-more-loading" : "custom-loading"
              }
            />
          ) : shouldRefresh && showRetry && data.data.length ? (
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
