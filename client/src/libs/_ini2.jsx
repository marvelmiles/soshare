import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback
} from "react";
import PropTypes from "prop-types";
import useViewIntersection from "hooks/useViewIntersection";
import http, { handleCancelRequest } from "api/http";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Loading from "components/Loading";
import EmptyData from "components/EmptyData";
import { isOverflowing } from "utils/validators";
import DataNotifier from "components/DataNotifier";
import { addToSet } from "utils";
import { isAtScrollBottom } from "utils/validators";
import { v4 as uniq } from "uuid";
import { isProdMode } from "context/constants";

const InfiniteFetch = React.forwardRef(
  (
    {
      children,
      intersectionProp,
      readyState = "ready",
      url,
      sx,
      searchParams = "",
      onDataChange,
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
      limit = isProdMode ? 30 : 4,
      scrollNodeRef, // Null or useRef
      searchId,
      randomize,
      NotifierComponent = DataNotifier,
      exclude = "",
      className = "",
      notifierProps,
      centerOnEmpty = true,
      contentSx,
      withOverflowShowEndOnly = true,
      withOverflowShowNotifierOnly = true,
      excludeSep = ",",
      withMatchedDocs,
      shallowLoading,
      maxRetry = 3,
      maxUserRetry = 5,
      verify,
      onBeforeFetch,
      onResponse
    },
    ref
  ) => {
    const [retry, setRetry] = useState(false);

    const [data, setData] = useState({
      data: [],
      ...defaultData
    });

    const [showRetryMsg, setShowRetryMsg] = useState(false);

    const [notifier, setNotifier] = useState({
      data: [],
      open: false
    });

    const containerRef = useRef();

    const scrollContRef =
      scrollNodeRef === undefined ? containerRef : scrollNodeRef;

    const isV = verify?.length >= 2 || true;

    const isT = verify === "fx";

    const stateRef = useRef({
      withScrollBottom: true,
      defaultShowEnd,
      intersection: intersectionProp
        ? undefined
        : {
            root: scrollContRef,
            verify
          },
      infinitePaging: {},
      prevNotice: [],
      userRetryCount: 0,
      retryCount: 0,
      forceRetryCount: 0,
      maxRetry,
      maxUserRetry,
      withDefaultData: !!defaultData,
      isFetching: false,
      hasVisitor: true,
      cancelKey: "-",
      key: uniq(),
      exclude: "",
      withMatchedDocs: false,
      dataChanged: false,
      preventFetch: false
    });

    const observedNodeRef = useRef();

    const showEnd =
      withOverflowShowEndOnly && stateRef.current.dataChanged
        ? (stateRef.current.defaultShowEnd = isOverflowing(
            scrollContRef?.current
          ))
        : stateRef.current.defaultShowEnd;

    const isReady = readyState === "ready";

    const nextCursor = data.paging?.nextCursor;

    let nullifyChildren =
      shallowLoading ||
      !isReady ||
      (data.data.length
        ? false
        : stateRef.current.infinitePaging.totalDoc === undefined ||
          nextCursor === undefined);

    let { isIntersecting } = useViewIntersection(
      observedNodeRef,
      stateRef.current.intersection || intersectionProp
    );

    // considering react remount x2 and a user long press the pgDn btn
    // isIntersecting get stucked to false after url cancellation
    // using threshold  helps prevent this before main intersection

    isIntersecting =
      nullifyChildren ||
      isIntersecting ||
      isAtScrollBottom(scrollContRef?.current || undefined, 0.77);

    const reachedMax = data.data.length === maxSize;

    const withPreviousData = (dataSize = -1) => {
      return (
        stateRef.current.dataChanged === false ||
        stateRef.current.isFetching ||
        stateRef.current.infinitePaging.totalDoc === dataSize
      );
    };

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

    const isEnd = stateRef.current.infinitePaging.totalDoc
      ? data.data.length >= stateRef.current.infinitePaging.totalDoc
      : nextCursor === null;

    const hasReachedMaxUserRetry =
      stateRef.current.userRetryCount === stateRef.current.maxUserRetry;

    const loading =
      !(showRetryMsg || hasReachedMaxUserRetry) &&
      (nullifyChildren ||
        (!stateRef.current.preventFetch && !isEnd && isIntersecting));

    nullifyChildren = (loading && !data.data.length) || nullifyChildren;

    const willFetch =
      !reachedMax &&
      !stateRef.current.preventFetch &&
      (stateRef.current.infinitePaging.totalDoc
        ? stateRef.current.isFetching || isEnd
          ? false
          : // ? stateRef.current.withFetch
            //   ? false
            //   : !isEnd && (isIntersecting || nullifyChildren)
            isIntersecting &&
            data.data.length < stateRef.current.infinitePaging.totalDoc
        : nextCursor === undefined);

    useEffect(() => {
      const stateCtx = stateRef.current;

      return () => {
        stateCtx.cancelKey = handleCancelRequest(stateCtx.cancelKey);
      };
    }, []);

    const propMemo = useMemo(() => {
      return {
        data,
        closeNotifier,
        data,
        loading,
        reachedMax,
        isIntersecting,
        isEnd,
        willRefetch: !!(data.data.length && data.paging?.nextCursor),
        dataChanged: stateRef.current.dataChanged,
        infinitePaging: stateRef.current.infinitePaging,
        shallowUpdate: stateRef.current.shallowUpdate,
        withPreviousData,
        scrollContRef,
        withOverflowShowEndOnly,
        observedNodeRef,
        preventFetch: stateRef.current.preventFetch,
        cancelRequest(all) {
          stateRef.current.preventFetch = true;
          handleCancelRequest(
            all === true ? undefined : stateRef.current.cancelKey
          );
          setRetry(false);
        },
        refetch(cb, context) {
          const stateCtx = stateRef.current;

          stateCtx.preventFetch = false;
          stateCtx.retryCount = 0;
          stateCtx.userRetryCount = 0;
          stateCtx.onFetch = cb;

          Object.assign(stateRef.current, context);

          setShowRetryMsg(false);
          setRetry(true);
        },
        setConfig(context) {
          Object.assign(stateRef.current, context);
        },

        setData: (prop, options = {}) => {
          let {
            numberOfEntries,
            exclude,
            withNotifier = true,
            withDefaultData,
            preventFetch,
            ...rest
          } = options;

          const { infinitePaging } = stateRef.current;

          prop =
            typeof prop === "function"
              ? prop({
                  ...data,
                  paging: { ...data.paging },
                  data: [...data.data]
                })
              : { ...prop };

          const dataSize = prop.data.length;
          const len = data.data.length;

          if (prop.paging?.nextCursor === null) {
            infinitePaging.totalDoc = 0;
            infinitePaging.matchedDocs = 0;
          } else if (
            rest.infinitePaging?.totalDoc === undefined &&
            infinitePaging.totalDoc > -1
          ) {
            if (dataSize < len && infinitePaging.totalDoc) {
              infinitePaging.totalDoc =
                infinitePaging.totalDoc - (dataSize ? len - dataSize : len);
            }
          }

          if (
            dataSize === infinitePaging.totalDoc &&
            !stateRef.current.isFetching &&
            prop.paging
          ) {
            prop.paging.nextCursor = null;
          }
          let _exclude = "";

          for (const item of prop.data) {
            _exclude += `${
              _exclude.length
                ? `${excludeSep}${item.id || item}`
                : item.id || item
            }`;
          }

          stateRef.current.forceRefetch = options.forceRefetch;

          stateRef.current.exclude = _exclude;

          stateRef.current.withDefaultData =
            withDefaultData === undefined || withDefaultData;

          stateRef.current.dataChanged =
            dataSize !== data.data.length ||
            data.paging?.nextCursor !== prop.paging?.nextCursor;

          exclude !== undefined &&
            (stateRef.current.exclude += exclude.length
              ? `${excludeSep}${exclude}`
              : exclude);

          stateRef.current.shallowUpdate = true;

          Object.assign(stateRef.current, rest);

          // handle new entries and notify
          if (withNotifier && dataSize && dataSize > data.data.length) {
            const newData = prop.data;

            numberOfEntries =
              numberOfEntries === undefined
                ? newData.length > data.data.length
                  ? 1
                  : 0
                : numberOfEntries;

            if (newData.length && numberOfEntries && notifierDelay > -1) {
              clearNotifierState(false);

              stateRef.current.prevNotice = newData
                .slice(0, numberOfEntries)
                .concat(stateRef.current.prevNotice || []);

              stateRef.current.dataNoticeStartTaskId = setTimeout(() => {
                setNotifier(notifier => {
                  if (!stateRef.current.prevNotice.length) return notifier;

                  return {
                    ...notifier,
                    data: stateRef.current.prevNotice,
                    open: true
                  };
                });

                stateRef.current.prevNotice = [];

                stateRef.current.dataNoticeEndTaskId = setTimeout(
                  () => closeNotifier(undefined, false),
                  notifierDuration
                );
              }, notifierDelay);
            } else closeNotifier(undefined, false);
          }

          setData(prop);
        }
      };
    }, [
      data,
      closeNotifier,
      notifierDelay,
      notifierDuration,
      reachedMax,
      withOverflowShowEndOnly,
      loading,
      scrollContRef,
      excludeSep,
      isIntersecting,
      isEnd
    ]);

    useEffect(() => {
      const stateCtx = stateRef.current;

      const props = {
        dataKey,
        currentData: data,
        dataSize: data.data.length,
        shallowUpdate: stateRef.current.shallowUpdate,
        dataChanged: stateRef.current.dataChanged,
        loading
      };

      onDataChange && onDataChange(props, stateCtx);
    }, [onDataChange, data, dataKey, loading]);

    useEffect(() => {
      if (ref) {
        propMemo.container = containerRef.current;
        if (typeof ref === "function") ref(propMemo);
        else ref.current = propMemo;
      }
    }, [propMemo, ref]);

    useEffect(() => {
      const stateCtx = stateRef.current;

      stateRef.current.dataChanged = false;

      let { infinitePaging, exclude: _exclude } = stateCtx;

      let currentData = { ...data };

      const shouldSearch = searchId && searchId !== stateCtx.searchId;

      let shouldFetch =
        isV &&
        isReady &&
        ((isEnd && retry) ||
          (!stateCtx.isFetching && (shouldSearch || willFetch)));

      const _httpConfig = {
        withCredentials,
        _reqKey: stateCtx._reqKey || stateCtx.key,
        _isT: isT,
        ...httpConfig
      };

      // isT &&
      //   console.log(
      //     shouldFetch,
      //     willFetch,
      //     isReady,
      //     dataKey,
      //     stateCtx.isFetching,
      //     retry,
      //     stateRef.current.state,
      //     stateRef.current.withMatchedDocs,
      //     currentData.data.length,
      //     infinitePaging.totalDoc,
      //     stateRef.current.preventFetch
      //   );

      let e = "";

      if (_httpConfig.withCredentials) stateCtx.hasVisitor = false;
      else if (!stateRef.current.hasVisitor) {
        stateCtx.hasVisitor = true;
        stateCtx.withMatchedDocs = true;
        stateCtx.withDefaultData = true;
        stateRef.current.dataChanged = true;

        const publicData = [];

        for (const item of currentData.data) {
          if (item.visibility && item.visibility !== "everyone") continue;

          const id = item.id || item;

          e += e.length ? `${excludeSep}${id}` : id;

          publicData.push(item);
        }

        shouldFetch = publicData.length < infinitePaging.matchedDocs;

        stateCtx.exclude = e;
        _exclude = e;

        currentData = {
          paging: {
            ...currentData.paging
          },
          data: publicData
        };
      }

      let nextCursor = currentData.paging?.nextCursor || "";

      let _randomize = randomize || infinitePaging.totalDoc === undefined;

      let _withMatchedDocs =
        withMatchedDocs || stateRef.current.withMatchedDocs;

      let withEq = true;

      if (shouldSearch) {
        stateRef.current.searchId = searchId;

        stateRef.current.dataChanged = true;

        const index = data.data.findIndex(
          d => d.id === searchId || d === searchId
        );

        if (index > -1) {
          _randomize = false;
          withEq = false;

          currentData.data = currentData.data
            .slice(index)
            .filter(
              item =>
                new Date(item.createdAt).getTime() <=
                new Date(currentData.data[index].createdAt).getTime()
            ); // based on sort order for now

          currentData.paging.nextCursor =
            currentData.data[currentData.data.length - 1].id;

          if (currentData.data.length === stateCtx.infinitePaging.totalDoc)
            shouldFetch = false;
          else nextCursor = currentData.data[currentData.data.length - 1]?.id;
        } else {
          _randomize = true;
          withEq = true;

          nextCursor = searchId;
          currentData = { data: [] };
          stateCtx.infinitePaging = {};
        }
      }

      // if (stateRef.current.dataChanged) setData(currentData);

      if (shouldFetch) {
        stateCtx.isFetching = true;

        const _url = `${url}?limit=${limit}&cursor=${nextCursor}&withEq=${withEq}&randomize=${_randomize}&withMatchedDocs=${_withMatchedDocs}&exclude=${_exclude}&${
          stateCtx.searchParams ? stateCtx.searchParams + "&" : ""
        }${searchParams ? searchParams + "&" : ""}${
          dataKey ? `select=${dataKey}&` : ""
        }`;

        stateCtx.cancelKey = _url + (stateCtx._reqKey || stateCtx.key);

        (async () => {
          try {
            onBeforeFetch && onBeforeFetch(_url, stateCtx);

            let newData = await http.get(_url, _httpConfig);

            dataKey && (newData = newData[dataKey]);

            stateRef.current.dataChanged =
              newData.data.length !== currentData.data.length ||
              currentData.paging?.nextCursor !== newData.paging?.nextCursor;

            const safelyRetry = () => {
              if (stateRef.current.forceRetryCount >= 100) {
                stateCtx.forceRetryCount = 0;
                setShowRetryMsg(true);
                console.warn(
                  "Memory leak: Data refetch stopped. Threshold exceeded!"
                );
              } else {
                stateCtx.forceRetryCount++;
                setRetry(true);
              }
            };

            const set =
              !stateCtx.withDefaultData && _exclude
                ? (() => {
                    const set = {};
                    _exclude.split(excludeSep).forEach(item => {
                      return (set[item] = true);
                    });
                    return set;
                  })()
                : {};

            newData.data = stateCtx.withDefaultData
              ? addToSet(currentData.data.concat(newData.data), undefined, set)
              : currentData.data.concat(addToSet(newData.data, undefined, set));

            if (_withMatchedDocs || _randomize) {
              if (newData.paging.matchedDocs > -1) {
                if (infinitePaging.totalDoc === undefined || _withMatchedDocs) {
                  stateRef.current.infinitePaging.totalDoc =
                    infinitePaging.totalDoc &&
                    infinitePaging.totalDoc > newData.paging.matchedDocs
                      ? infinitePaging.totalDoc
                      : newData.paging.matchedDocs;
                }

                infinitePaging.matchedDocs = newData.paging.matchedDocs;
              } else return safelyRetry();
            }

            e = "";

            if (set)
              for (const key in set) {
                e += `${e.length ? excludeSep + key : key}`;
              }

            setShowRetryMsg(false);

            stateCtx.forceRefetch = false;
            stateCtx.forceRetryCount = 0;
            stateCtx.retryCount = 0;
            stateCtx.userRetryCount = 0;
            stateCtx.exclude = e;
            stateCtx.shallowUpdate = false;
            stateCtx.withDefaultData = undefined;
            stateCtx.searchParams = "";
            stateCtx.tempUrl = "";

            newData = {
              ...newData,
              paging: {
                ...currentData.paging,
                ...newData.paging
              }
            };

            setRetry(false);

            onResponse && onResponse(undefined, newData, stateCtx);

            setData(newData);
            stateCtx.onFetch && stateCtx.onFetch(undefined, newData, stateCtx);
          } catch (err) {
            isT && console.error(err, "inf err");
            stateCtx.onFetch && stateCtx.onFetch(err);
            onResponse && onResponse(err);
          } finally {
            stateCtx.isFetching = false;
          }
        })();
      } else if (stateCtx.onFetch) {
        stateCtx.onFetch(
          undefined,
          e ? currentData : { ...currentData },
          stateCtx
        );
      }
    }, [
      data,
      isEnd,
      retry,
      willFetch,
      isReady,
      isV,
      isT,
      httpConfig,
      withCredentials,
      excludeSep,
      limit,
      searchParams,
      dataKey,
      url,
      randomize,
      withMatchedDocs,
      onBeforeFetch,
      onResponse,
      searchId
    ]);

    const handleRefetch = useCallback(
      e => {
        e.stopPropagation();

        stateRef.current.userRetryCount = hasReachedMaxUserRetry
          ? 1
          : stateRef.current.userRetryCount + 1;

        stateRef.current.retryCount = 0;
        stateRef.current.forceRetryCount = 0;

        setShowRetryMsg(false);
        setRetry(true);
      },
      [hasReachedMaxUserRetry]
    );

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
          position: "relative",
          overflow: "hidden",
          flex: 1,
          width: "100%",
          "&,.data-scrollable-content": {
            display: "flex",
            flexDirection: "column",
            justifyContent: fullHeight ? "center" : "normal",
            flexDirection: "column",
            height: "inherit",
            minHeight: "inherit"
          },
          ".data-scrollabe-main": {
            display: "flex",
            flexDirection: "column",
            flex: loading ? 0 : !data.data.length && centerOnEmpty ? 1 : 0
          },
          ...sx
        }}
      >
        {notifierDelay > -1 &&
        (withOverflowShowNotifierOnly ? showEnd : true) ? (
          <NotifierComponent
            containerRef={scrollContRef}
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
            ...contentSx,
            border: "1px solid red"
          }}
        >
          <div className="data-scrollabe-main">
            {nullifyChildren ? null : children(propMemo)}
            <div
              style={{ border: "1px solid transparent" }}
              ref={observedNodeRef}
            ></div>
          </div>

          <div style={{ padding: "4px 0" }}>
            {hasReachedMaxUserRetry || (showRetryMsg && nullifyChildren) ? (
              <EmptyData nullifyBrand withReload onClick={handleRefetch} />
            ) : showRetryMsg ? (
              <EmptyData
                sx={{
                  height: "80px",
                  minHeight: "80px"
                }}
                onClick={handleRefetch}
              />
            ) : loading ? (
              <Loading className={"custom-loading"} />
            ) : data.data.length ? (
              reachedMax ? (
                maxSizeElement
              ) : isEnd && (withOverflowShowEndOnly ? showEnd : true) ? (
                endElement
              ) : null
            ) : null}
          </div>
        </div>
      </Box>
    );
  }
);

InfiniteFetch.propTypes = {};

export default InfiniteFetch;
