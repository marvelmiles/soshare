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
      intersectionProp = {
        threshold: 0
      },
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
      randomize
    },
    ref
  ) => {
    const [loading, setLoading] = useState(!!readyState);
    const [data, setData] = useState({
      data: [],
      ...defaultData
    });
    const [showEnd, setShowEnd] = useState(defaultShowEnd);
    const [notice, setNotice] = useState({
      data: [],
      open: false
    });
    const [showRetry, setShowRetry] = useState(false);
    const { setSnackBar } = useContext();
    const [observedNode, setObservedNode] = useState(null);
    const stateRef = useRef({
      randomize,
      intersection: intersectionProp,
      prevNotice: [],
      defaultShowEnd,
      limit,
      loading: false, // indicator if searchId isn't found
      withDefaultData: !!defaultData,
      prevNotice: [],
      randomizePaging: {},
      isint: true
    });
    const { isIntersecting, resetObserverEntry } = useViewIntersection(
      observedNode,
      stateRef.current.intersection
    );
    const containerRef = useRef();

    const reachedMax = useMemo(
      () =>
        data.data.length === maxSize
          ? true
          : data.data.length + limit > maxSize &&
            (stateRef.current.limit = maxSize - data.data.length) &&
            false,
      [data.data.length, limit, maxSize]
    );

    const determineFlowing = useCallback(() => {
      setShowEnd(() => {
        return isOverflowing(
          scrollNodeRef ? scrollNodeRef.current : containerRef.current
        );
      });
    }, [scrollNodeRef]);

    const fetchData = useCallback(
      (config = {}) => {
        let {
          retry,
          isIntersecting,
          searchId,
          randomize: withRandom = true
        } = config;
        setData(data => {
          if (readyState && readyState !== "pending" && !reachedMax) {
            const _fetchData =
              retry ||
              isIntersecting ||
              searchId ||
              !data.data.length ||
              data.paging?.nextCursor === undefined;

            if (_fetchData) {
              setLoading(true);
              setShowRetry(false);
              const refetch = data.paging
                ? !data.data.length && data.paging.nextCursor
                : true;

              const shouldSearch =
                !isIntersecting &&
                (data.paging?.nextCursor === null || reachedMax) &&
                searchId &&
                searchId !== stateRef.current.searchId;

              let shouldFetch = !!(retry || refetch
                  ? !!url
                  : (shouldSearch && searchId) ||
                    (isIntersecting && data.paging?.nextCursor)),
                withEq =
                  isIntersecting ||
                  !(
                    withRandom === false ||
                    stateRef.current.randomizePaging.refetch ||
                    stateRef.current.randomizePaging.fetchCount ||
                    stateRef.current.randomizePaging.skippedLimit
                  );
              withRandom = isIntersecting ? false : withRandom;
              let _limit = stateRef.current.limit;

              if (shouldSearch && data.paging) {
                const targetDate = data.data.find(
                  d => d.id === searchId || d === searchId
                )?.createdAt;

                if (targetDate) {
                  data.data = data.data.filter(
                    item =>
                      new Date(item.createdAt).getTime() <=
                      new Date(targetDate).getTime()
                  );
                  withRandom = "false";
                  withEq = "false";
                  _limit =
                    data.data.length > _limit
                      ? data.data.length - _limit
                      : _limit - data.data.length;
                  if (
                    !data.paging?.nextCursor ||
                    _limit === 0 ||
                    _limit - 1 === 0
                  ) {
                    data.paging.nextCursor = null;
                    shouldFetch = false;
                  } else {
                    const cursor = data.data[data.data.length - 1]?.id;
                    data.paging.nextCursor =
                      cursor && cursor !== searchId ? cursor : null;
                  }
                  stateRef.current.dataChanged = true;
                  handleAction &&
                    handleAction("data", {
                      currentData: data,
                      shallowUpdate: true,
                      dataSize: data.length
                    });
                } else {
                  stateRef.current.loading = true;
                  setLoading(true);
                }
                stateRef.current.searchId = searchId;
              }

              if (shouldFetch) {
                if (!stateRef.current.initFetch) {
                  stateRef.current.initFetch = true;
                  (async () => {
                    const refetched = !!(
                      data.data.length && data.paging?.nextCursor
                    );
                    try {
                      withRandom = "false";
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
                        data.paging.nextCursor !== _data.paging.nextCursor ||
                        data.data.length !== _data.data.length;
                      stateRef.current.isNewData = stateRef.current.dataChanged;

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
                      const _paging = stateRef.current.randomizePaging;

                      console.log(data.paging, isIntersecting);
                      if (data.paging.matchedDocs && !_paging.matchedDocs) {
                        stateRef.current.randomizePaging = data.paging;
                      } else if (
                        data.paging.nextCursor === null &&
                        _paging.matchedDocs !== data.data.length
                      ) {
                        data.paging.nextCursor = "";
                        stateRef.current.randomizePaging.fetchCount =
                          data.data.length;
                        stateRef.current.randomizePaging.refetch = true;
                      } else if (_paging.fetchCount) {
                        _paging.refetch = false;
                        if (_paging.fetchCount !== _paging.matchedDocs) {
                          _paging.fetchCount = _paging.fetchCount + 1;
                          if (_paging.fetchCount === _paging.matchedDocs) {
                            data.paging.nextCursor = null;
                            _paging.fetchCount = 0;
                          }
                        }
                      }

                      setData(data);
                      setLoading(false);
                      return data;
                    } catch (message) {
                      handleAction && handleAction("error", message);
                      !refetched && setData(prev => ({ ...prev, paging: {} }));
                      setShowRetry(true);
                      (withCredentials || withError) && setSnackBar(message);
                      setLoading(false);
                    } finally {
                      stateRef.current.loading = false;
                      stateRef.current.initFetch = false;
                    }
                  })();
                }
              } else if (!stateRef.current.initFetch) setLoading(false);
            }

            if (withCredentials === false) {
              // render only public data during session timeout
              // or user isn't logged in
              data.data = data.data.filter(item =>
                item.visibility ? item.visibility === "everyone" : true
              );
            }
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
        withError
      ]
    );
    const closeNotifier = useCallback((resetDelay = 500, e) => {
      e && e.stopPropagation();
      setNotice(notice => ({
        ...notice,
        open: false
      }));
      let timerId;
      timerId = setTimeout(() => {
        if (timerId) clearTimeout(timerId);
        setNotice(notice => ({ ...notice, data: [] }));
      }, resetDelay);
    }, []);

    const propMemo = useMemo(
      () => ({
        closeNotifier,
        fetchData,
        data,
        willRefetch: !!(data.data.length && data.paging?.nextCursor),
        dataChanged: stateRef.current.dataChanged,
        isNewData: stateRef.current.isNewData,
        randomizePaging: stateRef.current.randomizePaging,
        setObservedNode: nodeOrFunc => {
          stateRef.current.dataChanged = false;
          determineFlowing();
          setObservedNode(nodeOrFunc);
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
        determineFlowing
      ]
    );

    // useEffect(() => {
    //   fetchData({ searchId, randomize: stateRef.current.randomize });
    // }, [fetchData, searchId]);

    useEffect(() => {
      fetchData({ isIntersecting });
    }, [fetchData, isIntersecting, observedNode]);

    useEffect(() => {
      stateRef.current.randomizePaging.refetch &&
        fetchData({ retry: true, randomize: false });
    }, [fetchData, stateRef.current.randomizePaging.refetch]);

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

    const isEnd = data.paging?.nextCursor === null;
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
    // for some wierd reason loading might be false
    // const showLoading = loading; // || (isIntersecting && !isEnd);

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
              stateRef.current.loading || !data.data.length
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
            ) : (data.paging?.nextCursor &&
                !data.data.length &&
                data.paging.nextCursor) ||
              data.paging?.nextCursor === undefined ||
              stateRef.current.loading ? null : (
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
