// no state mix

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
import { isOverflowing } from "utils/validators";
import { Link } from "react-router-dom";
import { debounce } from "@mui/material";

Avatar.defaultProps = {
  sx: {
    width: 25,
    height: 25,
    fontSize: "12px"
  }
};
export const DataNotifier = ({
  data,
  message = "Soshared",
  open,
  sx,
  containerRef,
  yCoords = 110,
  position,
  closeNotifier
}) => {
  const [portal, setPortal] = useState(null);
  useEffect(() => {
    const node = containerRef
      ? containerRef.current || containerRef
      : document.documentElement;
    if (node)
      setPortal(
        ReactDom.createPortal(
          <Button
            variant="contained"
            sx={{
              zIndex: "modal",
              borderRadius: "32px",
              minWidth: "0px",
              width: "250px",
              flexWrap: "wrap",
              gap: 1,
              left: "50%",
              top: 0,
              transition: `transform 0.3s ease-out`,
              transform: `translate(-50%,${open ? yCoords : -(yCoords * 2)}px)`,
              position:
                position ||
                (node === document.documentElement ? "fixed" : "absolute")
            }}
            onClick={e => {
              e.stopPropagation();
              node.scrollTo({ top: 0, behavior: "smooth" });
              closeNotifier();
            }}
          >
            <NorthIcon sx={{ minWidth: "auto", width: "auto" }} />
            <AvatarGroup max={4}>
              {data.map(({ user: { id, username, photoUrl } }, i) => (
                <Avatar
                  key={i}
                  alt={`${username} avatar`}
                  src={`${photoUrl}`}
                  component={Link}
                  to={`/u/${id}`}
                />
              ))}
            </AvatarGroup>
            <Typography
              variant="subtitle"
              sx={{
                wordBreak: "break-word"
              }}
            >
              {message}
            </Typography>
          </Button>,
          node.parentElement || node
        )
      );
  }, [containerRef, data, message, open, sx, yCoords, position, closeNotifier]);
  return portal;
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
      NoticeComponent = DataNotifier,
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
      validatePublicDatum
    },
    ref
  ) => {
    const [data, setData] = useState({
      data: [],
      ...defaultData
    });
    const [showEnd, setShowEnd] = useState(defaultShowEnd);
    const [notice, setNotice] = useState({
      data: [],
      open: false
    });

    const containerRef = useRef();
    const [refetchSkipped, setRefetchSkipped] = useState(false);
    const [showRetry, setShowRetry] = useState(false);
    const { setSnackBar } = useContext();
    const [observedNode, setObservedNode] = useState(null);
    const stateRef = useRef({
      randomize,
      readyState,
      intersection: intersectionProp
        ? undefined
        : {
            root: scrollNodeRef === null ? null : scrollNodeRef || containerRef,
            verify
          },
      prevNotice: [],
      defaultShowEnd,
      limit,
      withDefaultData: !!defaultData,
      prevNotice: [],
      randomizePaging: {},
      forceRefetchCount: 0
    });

    const { isIntersecting } = useViewIntersection(
      observedNode,
      stateRef.current.intersection || intersectionProp
    );

    const reachedMax = useMemo(
      () =>
        data.data.length === maxSize
          ? true
          : data.data.length + limit > maxSize &&
            (stateRef.current.limit = maxSize - data.data.length) &&
            false,
      [data.data.length, limit, maxSize]
    );

    const isntReady = stateRef.current.readyState !== "ready",
      isEnd = data.paging?.nextCursor === null && !isntReady,
      loading =
        isntReady || (isIntersecting && data.paging?.nextCursor !== null);

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

    const fetchData = useCallback(
      (config = {}) => {
        let {
          retry,
          randomize: withRandom = stateRef.current.randomize
        } = config;
        setData(data => {
          stateRef.current.dataChanged = false;
          const _preya = stateRef.current.randomizePaging,
            shouldRefetch =
              _preya.matchedDocs &&
              data.data.length === _preya.fetchCount &&
              (!isIntersecting ||
                (isIntersecting && stateRef.current.resetCursor));

          console.log(shouldRefetch, " shud refetch ");
          if (readyState && readyState !== "pending" && !reachedMax) {
            let _limit = stateRef.current.limit;

            const _fetchData =
              !stateRef.current.initFetch &&
              (retry ||
                isIntersecting ||
                searchId ||
                shouldRefetch ||
                !data.data.length ||
                data.paging?.nextCursor === undefined);
            const refetchSkipped = (dataSize, forceRefetch) => {
              verify && console.log(" will refetch ");
              forceRefetch && (stateRef.current.forceRefetchCount += 1);
              forceRefetch && console.log(" has forced refetch ");
              stateRef.current.initFetch = false;
              data.paging.nextCursor = "";
              stateRef.current.randomizePaging.fetchCount = dataSize;
              stateRef.current.randomizePaging.refetch = true;
              setRefetchSkipped(true);
            };
            if (_fetchData) {
              stateRef.current.readyState = "loading";
              stateRef.current.cursor = data.paging?.nextCursor;
              stateRef.current.initFetch = true;
              setShowRetry(false);
              const refetch = data.paging
                ? !data.data.length && data.paging.nextCursor
                : true;

              const shouldSearch =
                  (data.paging?.nextCursor === null ||
                    reachedMax ||
                    !isIntersecting) &&
                  searchId &&
                  searchId !== stateRef.current.searchId,
                shouldFetchSearch = !!(
                  stateRef.current.searchId && data.paging?.nextCursor
                );

              withRandom = shouldFetchSearch
                ? false
                : isIntersecting
                ? false
                : withRandom;

              let shouldFetch = !!(retry || refetch
                  ? !!url
                  : (shouldSearch && searchId) ||
                    (isIntersecting && data.paging.nextCursor) ||
                    shouldFetchSearch ||
                    shouldRefetch),
                withEq = shouldFetchSearch
                  ? false
                  : isIntersecting ||
                    !(
                      withRandom === false ||
                      stateRef.current.randomizePaging.refetch ||
                      stateRef.current.randomizePaging.fetchCount ||
                      stateRef.current.randomizePaging.skippedLimit
                    );
              verify &&
                console.log(
                  shouldSearch,
                  shouldFetch,
                  isIntersecting,
                  shouldFetchSearch,
                  !!data.paging?.nextCursor,
                  _preya.matchedDocs,
                  _preya.fetchCount,
                  " shud search "
                );
              if (shouldSearch && data.paging) {
                stateRef.current.searchId = searchId;
                stateRef.current.initFetch = false;
                stateRef.current.dataChanged = true;
                const index = data.data.findIndex(
                  d => d.id === searchId || d === searchId
                );
                if (index > -1) {
                  const _withSkipped =
                    !data.paging.nextCursor &&
                    _preya.matchedDocs &&
                    !_preya.reachedMax;

                  data.data = data.data
                    .slice(index)
                    .filter(
                      item =>
                        new Date(item.createdAt).getTime() <=
                        new Date(data.data[index].createdAt).getTime()
                    );

                  if (isIntersecting) {
                    withRandom = false;
                    withEq = false;
                  }
                  if (_withSkipped) {
                    // refetched skipped
                  } else if (
                    (data.paging.nextCursor
                      ? false
                      : _preya.matchedDocs
                      ? data.data.length === _preya.matchedDocs
                      : true) ||
                    (_limit =
                      data.data.length > _limit
                        ? _limit || Infinity
                        : _limit > data.data.length
                        ? _limit - data.data.length
                        : _limit) === 0
                  ) {
                    data.paging.nextCursor = null;
                    shouldFetch = false;
                  } else {
                    data.paging.nextCursor = data.data[data.data.length - 1].id;
                    shouldFetch = isIntersecting;
                  }

                  handleAction &&
                    handleAction("data", {
                      currentData: data,
                      shallowUpdate: true,
                      dataSize: data.length
                    });
                } else {
                  withRandom = true;
                  withEq = true;
                  stateRef.current.readyState = "pending";
                  data.data = [];
                  delete data.paging;
                }

                stateRef.current.forceRefetchCount = 0;
                _preya.refetch = false;
                _preya.fetchCount = data.data.length;
                verify &&
                  console.log(index, shouldFetch, isIntersecting, " shud ");
              }
              const fetchSkipped = forceRefetch => {
                _preya.refetch = false;
                if (stateRef.current.randomize === true) {
                  verify &&
                    console.log(
                      data.data.length,
                      _preya,
                      stateRef.current.dataChanged,
                      " randomizing "
                    );
                  if (forceRefetch && data.data.length < _preya.matchedDocs) {
                    verify && console.log(" has forced ");
                    refetchSkipped(data.data.length, forceRefetch);
                  } else if (data.paging.matchedDocs && !_preya.matchedDocs) {
                    verify && console.log(" with randoming ");
                    stateRef.current.randomizePaging = data.paging;
                  } else if (_preya.fetchCount) {
                    verify && console.log("counting....");
                    const handleStopFetching = () => {
                      data.paging.nextCursor = null;
                      _preya.fetchCount = 0;
                    };
                    if (_preya.fetchCount < _preya.matchedDocs) {
                      _preya.fetchCount = data.data.length;
                      if (data.data.length === _preya.matchedDocs)
                        handleStopFetching();
                      else {
                        data.paging.nextCursor =
                          data.data[data.data.length - 1].id;
                      }
                      const _shouldRefetch =
                        _preya.matchedDocs &&
                        data.data.length === _preya.fetchCount &&
                        (!isIntersecting ||
                          (isIntersecting && stateRef.current.resetCursor));
                      verify &&
                        console.log(
                          " in fetch ",
                          _preya.fetchCount,
                          _preya.matchedDocs,
                          data.data.length,
                          isIntersecting,
                          _shouldRefetch
                        );
                    } else handleStopFetching();
                  } else if (
                    data.paging.nextCursor === null &&
                    data.data.length < _preya.matchedDocs
                  ) {
                    verify && console.log(" with refetch");
                    refetchSkipped(data.data.length, forceRefetch);
                  } else if (!stateRef.current.randomizePaging.matchedDocs) {
                    console.log(" no matched docs ");
                    stateRef.current.randomize = false;
                    stateRef.current.randomizePaging = {};
                  }
                }
              };
              if (shouldFetch) {
                (async () => {
                  const refetched = !!(
                    data.data.length && data.paging?.nextCursor
                  );
                  try {
                    const _url =
                      url +
                      `?limit=${_limit || ""}&cursor=${searchId ||
                        data.paging?.nextCursor ||
                        ""}&withEq=${withEq}&randomize=${withRandom}&exclude=${data.data
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

                    if (dataKey)
                      _data = _data[dataKey] || {
                        data: [],
                        paging: {}
                      };
                    // reassigning the variable helps return the current
                    // state should incase the fetch returns before the
                    // function ends
                    stateRef.current.dataChanged =
                      !data.paging?.nextCursor ||
                      shouldFetchSearch ||
                      data.paging.nextCursor !== _data.paging.nextCursor ||
                      data.data.length !== _data.data.length;
                    stateRef.current.isNewData = stateRef.current.dataChanged;

                    // helps with refetch during randomize
                    // shouldSearch || shouldFetchSearch.
                    const forceRefetch =
                      _preya.matchedDocs &&
                      !_data.data.length &&
                      stateRef.current.forceRefetchCount < _preya.matchedDocs;

                    data = {
                      ..._data,
                      data: (withEq === "true" && searchId
                      ? false
                      : !stateRef.current.withDefaultData || data.paging)
                        ? data.data.concat(_data.data)
                        : _data.data
                    };

                    if (handleAction)
                      handleAction("data", {
                        currentData: data,
                        refetched,
                        dataSize: data.length
                      });
                    fetchSkipped(forceRefetch);
                    setData(data);
                    return data;
                  } catch (message) {
                    handleAction && handleAction("error", message);
                    !refetched && setData(prev => ({ ...prev, paging: {} }));
                    setShowRetry(true);
                    (withCredentials || withError) && setSnackBar(message);
                  } finally {
                    // shouldFetchSearch &&  (stateRef.current.searchId = "");
                    stateRef.current.initFetch = false;
                    stateRef.current.resetCursor = false;
                    stateRef.current.readyState = "ready";
                    setRefetchSkipped(false);
                  }
                })();
              } else if (!_preya.refetch) {
                stateRef.current.readyState = "ready";
                stateRef.current.initFetch = false;
              }
            } else {
              if (!stateRef.current.initFetch)
                stateRef.current.readyState = "ready";
              if (shouldRefetch) {
                verify && console.log(" shuld refetch outside ");
                if (stateRef.current.initFetch) console.log(" is init fetch");
                else {
                  console.log(" outisde will refetch");
                  refetchSkipped(data.data.length);
                }
              }
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
          return { ...data };
        });
      },
      [
        url,
        readyState,
        setSnackBar,
        searchParams,
        handleAction,
        httpConfig,
        dataKey,
        withCredentials,
        reachedMax,
        withError,
        validatePublicDatum,
        verify,
        searchId,
        isIntersecting
      ]
    );

    const closeNotifier = useCallback((resetDelay = 500, e) => {
      e && e.stopPropagation();
      setNotice(notice => ({
        ...notice,
        open: false
      }));
      let timerId = setTimeout(() => {
        if (timerId) clearTimeout(timerId);
        setNotice(notice => ({ ...notice, data: [] }));
      }, resetDelay);
    }, []);

    const propMemo = useMemo(
      () => ({
        closeNotifier,
        fetchData,
        data,
        loading,
        willRefetch: !!(data.data.length && data.paging?.nextCursor),
        dataChanged: stateRef.current.dataChanged,
        isNewData: stateRef.current.isNewData,
        randomizePaging: stateRef.current.randomizePaging,
        setObservedNode: (nodeOrFunc, withDataChanged = true) => {
          if (
            withDataChanged ? nodeOrFunc && stateRef.current.dataChanged : true
          ) {
            determineFlowing();
            setObservedNode(node => (node !== nodeOrFunc ? nodeOrFunc : node));
          }
        },
        setData: (prop, numberOfEntries) => {
          const handleNotice = data => {
            if (data.length && numberOfEntries && noticeDelay > -1) {
              if (stateRef.newDataTaskId) clearInterval(stateRef.newDataTaskId);
              stateRef.current.prevNotice = data
                .slice(0, numberOfEntries)
                .concat(stateRef.current.prevNotice);
              stateRef.newDataTaskId = setTimeout(() => {
                setNotice(notice => ({
                  ...notice,
                  data: stateRef.current.prevNotice,
                  open: true
                }));
                stateRef.current.prevNotice = [];
                setTimeout(() => {
                  setNotice(notice => ({
                    ...notice,
                    open: false
                  }));
                }, noticeDuration);
              }, noticeDelay);
            }
          };
          if (typeof prop === "function") {
            setData(prev => {
              const data = prop(prev);
              if (data.data.length) handleNotice(data.data);
              else setShowEnd(false);
              return data;
            });
          } else {
            if (prop.data.length) handleNotice(prop.data);
            else setShowEnd(false);
            setData(prop);
          }
        }
      }),
      [
        data,
        noticeDelay,
        noticeDuration,
        fetchData,
        closeNotifier,
        determineFlowing,
        loading
      ]
    );
    // const silentFetch =
    //   stateRef.current.randomizePaging.matchedDocs &&
    //   data.data.length === stateRef.current.randomizePaging.fetchCount &&
    //   (!isIntersecting || (isIntersecting && stateRef.current.resetCursor));

    // verify &&
    //   console.log(
    //     silentFetch,
    //     loading,
    //     isIntersecting,
    //     stateRef.current.randomizePaging.fetchCount,
    //     " silent fetch "
    //   );

    useEffect(() => {
      fetchData(
        stateRef.current.randomizePaging.refetch
          ? { retry: true, randomize: false }
          : {}
      );
    }, [fetchData, stateRef.current.randomizePaging.refetch, refetchSkipped]);

    // useEffect(() => {
    //   if (stateRef.current.randomizePaging.refetch) {
    //     fetchData({ retry: true, randomize: false });
    //   }
    // }, [fetchData, stateRef.current.randomizePaging.refetch]);

    // useEffect(() => {
    //   fetchData(
    //     stateRef.current.randomizePaging.refetch
    //       ? { retry: true, randomize: false }
    //       : undefined
    //   );
    // }, [fetchData, stateRef.current.randomizePaging.refetch]);

    useEffect(() => {
      if (stateRef.current.defaultShowEnd)
        window.addEventListener("resize", determineFlowing, false);

      return () => {
        window.removeEventListener("resize", determineFlowing, false);
      };
    }, [determineFlowing]);

    if (ref) {
      propMemo.container = containerRef.current;
      ref.current = propMemo;
      if (ref) ref.current.data = data;
    }

    endElement = data.data.length
      ? endElement || (
          <Typography
            color="primary.dark"
            variant="h6"
            sx={{ py: 1 }}
            textAlign="center"
          >
            looks like you have reached the end!
          </Typography>
        )
      : null;

    maxSizeElement = data.data.length ? maxSizeElement || endElement : null;

    const nullifyChildren =
      stateRef.current.readyState === "pending" ||
      data.paging?.nextCursor === undefined;

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
        {noticeDelay > -1 && notice.data.length ? (
          <NoticeComponent
            containerRef={scrollNodeRef || containerRef}
            open={notice.open}
            data={notice.data}
            message={notice.message}
            closeNotifier={closeNotifier}
          />
        ) : null}
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
                  fetchData({ retry: true });
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
                  fetchData({ retry: true });
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
