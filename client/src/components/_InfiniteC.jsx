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
import http, { handleCancelRequest } from "api/http";
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
      limit = 4,
      scrollNodeRef,
      searchId,
      randomize,
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
      shallowLoading,
      verify
    },
    ref
  ) => {
    const [showEnd, setShowEnd] = useState(defaultShowEnd);

    const [data, setData] = useState({
      data: [],
      ...defaultData
    });
    const [observedNode, setObservedNode] = useState(null);
    const [showRetry, setShowRetry] = useState(false);
    const [loading, setLoading] = useState(true);

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
      searchId,
      searchParams,
      url,
      dataKey,
      httpConfig,
      withCredentials,
      intersection: intersectionProp
        ? undefined
        : {
            root: scrollNodeRef === undefined ? containerRef : scrollNodeRef,
            verify
          },
      exclude,
      infinitePaging: {},
      prevNotice: [],
      retryCount: 0,
      maxRetry: 10,
      sep: excludeSep,
      withDefaultData: !!defaultData,
      isFetching: false,
      hasVisitor: true,
      key: Date.now()
    });
    const { isIntersecting } = useViewIntersection(
      observedNode,
      stateRef.current.intersection || intersectionProp
    );

    const reachedMax = useMemo(() => data.data.length === maxSize, [
      data.data.length,
      maxSize
    ]);

    const withPreviousData = (dataSize = -1) => {
      return (
        stateRef.current.dataChanged === false ||
        stateRef.current.isFetching ||
        stateRef.current.infinitePaging.matchedDocs === dataSize
      );
    };

    const fetchData = useCallback(
      (fetchConfig = {}) => {
        const {
          retry,
          infinitePagingConfig,
          readyState,
          intersectionKey,
          setSnackBar,
          ...restConfig
        } = fetchConfig;

        let infinitePaging = stateRef.current.infinitePaging;

        infinitePagingConfig &&
          (infinitePaging = Object.assign(
            infinitePaging,
            infinitePagingConfig
          ));

        stateRef.current = Object.assign(stateRef.current, restConfig);

        if (readyState !== "ready" || stateRef.current.isFetching) return;

        setData(data => {
          let {
            randomize = !intersectionKey || !data.data.length,
            limit = 20,
            withMatchedDocs = "",
            withShowRetry = "",
            reachedMax,
            searchId,
            searchParams,
            url,
            dataKey,
            httpConfig,
            withCredentials,
            isFetching
          } = stateRef.current;

          const sep = stateRef.current.sep;

          const shouldSearch =
            searchId && searchId !== stateRef.current.searchId;

          const shouldFetch =
            retry ||
            (!(reachedMax || isFetching) &&
              (shouldSearch
                ? true
                : infinitePaging.matchedDocs
                ? data.data.length < infinitePaging.matchedDocs &&
                  intersectionKey
                : data.paging?.nextCursor !== null));

          const _httpConfig = {
            withCredentials,
            ...httpConfig
          };

          if (_httpConfig.withCredentials) stateRef.current.hasVisitor = false;
          else if (!stateRef.current.hasVisitor) {
            stateRef.current.hasVisitor = true;
            stateRef.current.withMatchedDocs = true;
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

          if (shouldFetch) {
            let {
              randomize = !intersectionKey || !data.data.length,
              limit = 20,
              withMatchedDocs = "",
              withShowRetry = ""
            } = stateRef.current;

            setLoading(true);

            let withFetch = true,
              withEq = true,
              defaultCursor = "";

            if (withFetch) {
              stateRef.current.isFetching = true;
              (async () => {
                try {
                  stateRef.current.queryURL = stateRef.current._url;
                  stateRef.current._url =
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
                    }`;

                  let _data = await http.get(
                    stateRef.current._url,
                    _httpConfig
                  );

                  dataKey && (_data = _data[dataKey]);

                  if (
                    !isObject(_data) ||
                    (_data.paging?.nextCursor === undefined ||
                      !Array.isArray(_data.data))
                  ) {
                    stateRef.current.dataChanged = false;
                    stateRef.current.infinitePaging.matchedDocs = limit;

                    setSnackBar(
                      "Invalid body expect {data:Array,paging:{matchedDocs:Number,nextCursor:Null}} data structure"
                    );
                    setData({
                      ...data,
                      paging: {
                        nextCursor: null,
                        ...data.paging
                      }
                    });
                  } else {
                    stateRef.current.dataChanged =
                      !data.paging?.nextCursor ||
                      data.paging.nextCursor !== _data.paging.nextCursor ||
                      data.data.length !== _data.data.length;

                    if (
                      withMatchedDocs ||
                      (!infinitePaging.matchedDocs &&
                        _data.paging.matchedDocs > -1)
                    ) {
                      infinitePaging.withMatchedCursor =
                        _data.paging.nextCursor ||
                        infinitePaging.withMatchedCursor;
                      infinitePaging.matchedDocs =
                        _data.paging.matchedDocs || infinitePaging.matchedDocs;
                    }

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

                      stateRef.current.isFetching = 0;
                      setLoading(false);

                      return data;
                    });
                  }
                } catch (msg) {
                  verify === "t" &&
                    console.log(
                      msg,
                      stateRef.current.isFetching,
                      " infinite eror msg "
                    );
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
                  } else stateRef.current.isFetching = null;
                  setLoading(false);
                } finally {
                }
              })();
            }
          }

          return shouldFetch ? { ...data } : data;
        });
      },
      [verify]
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

    const nullifyChildren =
      shallowLoading ||
      stateRef.current.readyState === "pending" ||
      (data.data.length
        ? false
        : stateRef.current.infinitePaging.matchedDocs === undefined ||
          data.paging?.nextCursor === undefined);

    // verify === "t" &&
    //   console.log(
    //     nullifyChildren,
    //     readyState,
    //     stateRef.current.infinitePaging.matchedDocs === undefined,
    //     data.paging?.nextCursor === undefined,
    //     verify,
    //     data
    //   );

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
        withPreviousData,
        setObservedNode(nodeOrFunc, strictMode = true) {
          if (true) {
            setObservedNode(nodeOrFunc);
            withOverflowShowEndOnly &&
              stateRef.current.dataChanged &&
              data.paging?.nextCursor !== undefined &&
              setShowEnd(() => {
                return isOverflowing(
                  scrollNodeRef === undefined
                    ? containerRef.current
                    : scrollNodeRef
                    ? scrollNodeRef.current
                    : undefined
                );
              });
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

            dataSize &&
              data.data.length &&
              (stateRef.current.dataChanged = dataSize !== data.data.length);

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
        closeNotifier,
        fetchData,
        notifierDelay,
        notifierDuration,
        reachedMax,
        scrollNodeRef,
        withOverflowShowEndOnly,
        loading
        // verify
      ]
    );

    const isEnd = stateRef.current.infinitePaging.matchedDocs
      ? data.data.length >= stateRef.current.infinitePaging.matchedDocs
      : data.paging?.nextCursor === null;

    const willFetch = stateRef.current.infinitePaging.matchedDocs
      ? data.data.length < stateRef.current.infinitePaging.matchedDocs &&
        isIntersecting
      : data.paging?.nextCursor !== null;

    const nextCursor = data.paging?.nextCursor;

    const queryApi = useCallback(async () => {
      const {
        sep,
        searchId: prevSearchId,
        isFetching,
        infinitePaging,
        dataKey,
        url
      } = stateRef.current;

      const shouldSearch = searchId && searchId !== prevSearchId;

      const _randomize = randomize || infinitePaging.matchedDocs === undefined;
      const _withMatchedDocs = withMatchedDocs || false;

      const shouldFetch = !isFetching && (shouldSearch ? true : willFetch);

      console.log(isIntersecting, isFetching, willFetch, shouldFetch, {
        ...infinitePaging
      });

      if (shouldFetch) {
        setLoading(true);

        let withFetch = true,
          withEq = true,
          defaultCursor = "";

        const _httpConfig = {
          ...httpConfig,
          withCredentials
        };

        if (withFetch) {
            try {
              
                const _randomize  =  randomize || 

            stateRef.current.queryURL =
              url +
              `?limit=${limit}&cursor=${nextCursor ||
                defaultCursor}&withEq=${withEq}&randomize=${_randomize}&withMatchedDocs=${_withMatchedDocs}&exclude=${
                stateRef.current.exclude
              }&${
                searchParams ? searchParams : dataKey ? `select=${dataKey}` : ""
              }`;

            let _data = await http.get(stateRef.current.queryURL, _httpConfig);
            verify === "t" &&
              console.log(_data, dataKey, isIntersecting, {
                ...infinitePaging
              });
            dataKey && (_data = _data[dataKey]);

            if (
              !isObject(_data) ||
              (_data.paging?.nextCursor === undefined ||
                !Array.isArray(_data.data))
            )
              throw "Invalid body expect {data:Array,paging:{matchedDocs:Number,nextCursor:Null}} data structure";
            else {
              if (
                _withMatchedDocs ||
                (!infinitePaging.matchedDocs && _data.paging.matchedDocs > -1)
              ) {
                infinitePaging.withMatchedCursor =
                  _data.paging.nextCursor || infinitePaging.withMatchedCursor;
                infinitePaging.matchedDocs =
                  _data.paging.matchedDocs || infinitePaging.matchedDocs;
              }

              const exclude = stateRef.current.exclude || "";

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

              let e = "";
              if (set)
                for (const key in set) {
                  e += `${e.length ? sep + key : key}`;
                }

              let pending = false;
              setData(data => {
                // if (pending) return data;
                stateRef.current.dataChanged =
                  !data.paging?.nextCursor ||
                  data.paging.nextCursor !== _data.paging.nextCursor ||
                  data.data.length !== _data.data.length;
                data = {
                  ...data,
                  data: stateRef.current.withDefaultData
                    ? addToSet([..._data.data, ...data.data], undefined, set)
                    : data.data.concat(addToSet(_data.data, undefined, set))
                
                };

                stateRef.current.exclude = e;
                stateRef.current.shallowUpdate = false;
                stateRef.current.withDefaultData = undefined;

                return data;
              });
            }
          } catch (msg) {
            false && console.log(setSnackBar);
            verify === "t" && console.log(msg, verify, " infinite error ");
          } finally {
            stateRef.current.isFetching = false;
            setLoading(false);
          }
        }
      }
    }, [
      isIntersecting,
      searchId,
      limit,
      randomize,
      withMatchedDocs,
      searchParams,
      httpConfig,
      setSnackBar,
      withCredentials,
      verify,
      nextCursor,
      willFetch
    ]);

    useEffect(() => {
      queryApi();
      return () => {
        // console.log(stateRef.current.queryURL, "dd");
        // stateRef.current.queryURL &&
        //   handleCancelRequest(stateRef.current.queryURL);
      };
    }, [queryApi]);

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
      fetchData({ retry: true });
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

    const observedNodeId = `${stateRef.current.key}-infinite-${withCredentials}-${isIntersecting}`;

    return (
      <Box
        key={url + stateRef.current.key}
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

          <div
            style={{ border: "1px solid orange" }}
            key={observedNodeId}
            data-infinite-id={observedNodeId}
            ref={propMemo.setObservedNode}
          ></div>
        </div>
        <div>
          {nullifyChildren || !isEnd ? (
            <Loading
              className={"custom-loading"}
              sx={{ border: "1px solid red" }}
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
