// correct
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
import { isAtScrollBottom } from "utils/validators";
import { HTTP_DEFAULT_MSG } from "context/constants";
import { debounce } from "@mui/material";

const debounceFn = debounce((fn, node) => fn(node), 2500);

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
      verify
    },
    ref
  ) => {
    const [retry, setRetry] = useState(false);

    const [showEnd, setShowEnd] = useState(defaultShowEnd);

    const [data, setData] = useState({
      data: [],
      ...defaultData
    });
    const [observedNode, setObservedNode] = useState(null);
    const [showRetryMsg, setShowRetryMsg] = useState(false);

    const [notifier, setNotifier] = useState({
      data: [],
      open: false
    });
    const containerRef = useRef();
    const { setSnackBar } = useContext();

    const scrollContRef =
      scrollNodeRef === undefined ? containerRef : scrollNodeRef;

    const stateRef = useRef({
      limit,
      randomize,
      withMatchedDocs,
      searchId,
      searchParams,
      url,
      dataKey,
      httpConfig,
      withCredentials,
      withScrollBottom: true,
      intersection: intersectionProp
        ? undefined
        : {
            root: scrollContRef,
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

    const isV = verify === "t" || true;

    let { isIntersecting } = useViewIntersection(
      observedNode,
      stateRef.current.intersection || intersectionProp
    );

    // considering react remount x2 and a user long press the pgDn btn
    // isIntersecting get stucked to false after url cancellation
    // using threshold  helps prevent this before main intersection

    isIntersecting =
      isIntersecting ||
      isAtScrollBottom(scrollContRef?.current || undefined, 0.77, isV);

    const reachedMax = data.data.length === maxSize;

    const withPreviousData = (dataSize = -1) => {
      return (
        stateRef.current.dataChanged === false ||
        stateRef.current.isFetching ||
        stateRef.current.infinitePaging.matchedDocs === dataSize
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

    const isReady = readyState === "ready";

    const nextCursor = data.paging?.nextCursor;

    const nullifyChildren =
      shallowLoading ||
      !isReady ||
      (data.data.length
        ? false
        : stateRef.current.infinitePaging.matchedDocs === undefined ||
          nextCursor === undefined);

    const isEnd = stateRef.current.infinitePaging.matchedDocs
      ? data.data.length >= stateRef.current.infinitePaging.matchedDocs
      : nextCursor === null;

    const willFetch =
      isReady &&
      !reachedMax &&
      (stateRef.current.infinitePaging.matchedDocs
        ? data.data.length < stateRef.current.infinitePaging.matchedDocs &&
          (!showEnd || isIntersecting)
        : nextCursor === undefined);

    const hasReachedMaxRetry =
      stateRef.current.retryCount === stateRef.current.maxRetry;

    const loading =
      !(showRetryMsg || hasReachedMaxRetry) &&
      (nullifyChildren || (!isEnd && isIntersecting));

    verify === "t" &&
      console.log(
        willFetch,
        readyState,
        isIntersecting,
        stateRef.current.isFetching,
        stateRef.current.withScrollBottom,
        nextCursor,
        reachedMax,
        { ...data },
        stateRef.current.infinitePaging.matchedDocs,
        verify,
        scrollContRef?.current || undefined
      );

    useEffect(() => {
      const stateCtx = stateRef.current;

      const shouldSearch = false;

      const shouldFetch =
        isV &&
        (retry ||
          (!stateCtx.isFetching &&
            (shouldSearch ? true : !stateCtx.isFetching && willFetch)));

      let _url;

      if (shouldFetch) {
        const { infinitePaging, sep, exclude } = stateCtx;
        const _randomize =
          randomize || infinitePaging.matchedDocs === undefined;
        const _withMatchedDocs = withMatchedDocs || false;

        stateCtx.isFetching = true;

        let withEq = true,
          defaultCursor = "";

        const _httpConfig = {
          withCredentials,
          ...httpConfig
        };

        _url =
          url +
          `?limit=${limit}&cursor=${nextCursor ||
            defaultCursor}&withEq=${withEq}&randomize=${_randomize}&withMatchedDocs=${_withMatchedDocs}&exclude=${exclude}&${
            searchParams ? searchParams : dataKey ? `select=${dataKey}` : ""
          }`;

        (async () => {
          try {
            let _data = await http.get(_url, _httpConfig);

            dataKey && (_data = _data[dataKey]);

            if (
              infinitePaging.matchedDocs === undefined &&
              _data.paging.matchedDocs > -1
            ) {
              infinitePaging.matchedDocs = _data.data.length
                ? _data.paging.matchedDocs
                : 0;
            }

            setData(data => {
              const set =
                !stateCtx.withDefaultData && exclude
                  ? (() => {
                      const set = {};
                      exclude.split(sep).forEach(item => {
                        return (set[item] = true);
                      });
                      return set;
                    })()
                  : {};

              stateRef.current.dataChanged =
                data.paging?.nextCursor !== _data.paging.nextCursor ||
                data.data.length !== _data.data.length;

              data = {
                paging: {
                  ...data.paging,
                  ..._data.paging
                },
                data: stateCtx.withDefaultData
                  ? addToSet([..._data.data, ...data.data], undefined, set)
                  : data.data.concat(addToSet(_data.data, undefined, set))
              };

              let e = "";
              if (set)
                for (const key in set) {
                  e += `${e.length ? sep + key : key}`;
                }

              setShowRetryMsg(false);

              stateRef.current.retryCount = 0;
              stateCtx.exclude = e;
              stateCtx.shallowUpdate = false;
              stateCtx.withDefaultData = undefined;

              return data;
            });
          } catch (msg) {
            verify === "t" && console.log(msg, " cancelled ", verify);

            if (msg) {
              if (stateRef.current.retryCount < stateRef.current.maxRetry)
                setShowRetryMsg(true);
              else setShowRetryMsg(false);

              window.location.pathname.toLowerCase() !== "/auth/signin" &&
                msg !== HTTP_DEFAULT_MSG &&
                setSnackBar(msg);
            } else stateCtx.withScrollBottom = false;
          } finally {
            stateCtx.isFetching = false;
            setRetry(false);
          }
        })();
      }
      return () => {
        handleCancelRequest(_url);
      };
    }, [
      url,
      dataKey,
      limit,
      nextCursor,
      searchParams,
      randomize,
      willFetch,
      withMatchedDocs,
      httpConfig,
      withCredentials,
      setSnackBar,
      retry,
      isV,
      verify
    ]);

    const propMemo = useMemo(
      () => ({
        data,
        closeNotifier,
        data,
        loading,
        reachedMax,
        willRefetch: !!(data.data.length && data.paging?.nextCursor),
        dataChanged: stateRef.current.dataChanged,
        infinitePaging: stateRef.current.infinitePaging,
        shallowUpdate: stateRef.current.shallowUpdate,
        withPreviousData,
        scrollContRef,
        withOverflowShowEndOnly,
        setObservedNode: debounceFn.bind(
          this,
          (nodeOrFunc, strictMode = true) => {
            if (strictMode ? nodeOrFunc : true) {
              setObservedNode(nodeOrFunc);
              withOverflowShowEndOnly &&
                stateRef.current.dataChanged &&
                setShowEnd(isOverflowing(scrollContRef?.current));
            }
          }
        ),
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
        notifierDelay,
        notifierDuration,
        reachedMax,
        withOverflowShowEndOnly,
        loading,
        scrollContRef
      ]
    );

    useEffect(() => {
      if (ref) {
        propMemo.container = containerRef.current;
        ref.current = propMemo;
      }
    }, [propMemo, ref]);

    useEffect(() => {
      const props = {
        currentData: data,
        dataSize: data.data.length,
        shallowUpdate: stateRef.current.shallowUpdate,
        dataKey
      };

      handleAction && handleAction("data", props);
      // stateCtx &&
      //   (datakey ? (stateCtx[dataKey].data = data) : (stateCtx.data = data));
    }, [handleAction, data, dataKey]);

    const handleRefetch = e => {
      e.stopPropagation();

      stateRef.current.retryCount = hasReachedMaxRetry
        ? 1
        : stateRef.current.retryCount + 1;

      setShowRetryMsg(false);
      setRetry(true);
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
            ...contentSx
          }}
        >
          <div>{nullifyChildren ? null : children(propMemo)}</div>

          <div>
            {hasReachedMaxRetry || (showRetryMsg && nullifyChildren) ? (
              <EmptyData
                nullifyBrand
                withReload
                onClick={nullifyChildren ? undefined : handleRefetch}
              />
            ) : showRetryMsg ? (
              <EmptyData
                sx={{
                  height: "120px",
                  minHeight: "120px"
                }}
                onClick={handleRefetch}
              />
            ) : loading ? (
              <Loading className={"custom-loading"} />
            ) : reachedMax ? (
              maxSizeElement
            ) : isEnd && (withOverflowShowEndOnly ? showEnd : true) ? (
              endElement
            ) : null}
          </div>

          <div
            style={{ border: "1px solid transparent" }}
            ref={propMemo.setObservedNode}
          ></div>
        </div>
      </Box>
    );
  }
);

InfiniteScroll.propTypes = {};

export default InfiniteScroll;
