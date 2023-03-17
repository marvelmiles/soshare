import React, { useRef, useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import useViewIntersection from "hooks/useViewIntersection";
import { useContext } from "redux/store";
import http from "api/http";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Loading } from "./styled";
import NorthIcon from "@mui/icons-material/North";
import Button from "@mui/material/Button";
import AvatarGroup from "@mui/material/AvatarGroup";
import Avatar from "@mui/material/Avatar";
import Slide from "@mui/material/Slide";
import ReactDom from "react-dom";
import { isOverflowing } from "utils";
Avatar.defaultProps = {
  sx: {
    width: 25,
    height: 25,
    fontSize: "12px"
  }
};
export const DataNotifier = ({
  data,
  max = 4,
  message = "tweeted",
  open,
  sx,
  containerRef,
  yCoords = 110,
  position,
  cursorPagination
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
              border: "1px solid red",
              borderRadius: "32px",
              minWidth: "0px",
              color: "primary.dark",
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
            onClick={() => {
              node.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <NorthIcon sx={{ minWidth: "auto", width: "auto" }} />
            <AvatarGroup max={4}>
              {data.map((a = { user: {} }, i) => (
                <Avatar
                  key={i}
                  alt={`${a.username} avatar`}
                  src={`${a.photoUrl}`}
                />
              ))}
            </AvatarGroup>
            <Typography
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
  }, [containerRef, data, message, open, sx, yCoords, position]);
  return portal;
};
const InfiniteScroll = React.forwardRef(
  (
    {
      children,
      intersectionProp = {
        threshold: 0
      },
      autoFetch = true,
      url,
      limit = 20,
      sx,
      searchParams = "",
      handleAction,
      defaultData,
      showEndElement = true,
      endElement,
      NoticeComponent = DataNotifier,
      noticeDuration = 5000,
      noticeDelay = 5000,
      Component,
      componentProps,
      root,
      hideDataNotifier,
      httpConfig,
      dataKey
    },
    ref
  ) => {
    const [loading, setLoading] = useState(autoFetch);
    const [data, setData] = useState({
      data: []
      // ...defaultData
    });
    const [showEnd, setShowEnd] = useState(false);
    const [notice, setNotice] = useState({
      data: Array.from(new Array(7)),
      open: false
    });
    const { setSnackBar } = useContext();
    const [observedNode, setObservedNode] = useState(null);
    const stateRef = useRef({
      intersection: intersectionProp,
      prevNotice: []
    });
    const { isIntersecting, resetState } = useViewIntersection(
      observedNode,
      stateRef.current.intersection
    );
    const containerRef = useRef();
    const propMemo = useMemo(
      () => ({
        setObservedNode,
        data,
        setData: (prop, numberOfEntries) => {
          const handleNotice = data => {
            if (data.length && numberOfEntries) {
              if (stateRef.newDataTaskId) clearInterval(stateRef.newDataTaskId);
              stateRef.prevNotice = data
                .slice(0, numberOfEntries + 1)
                .concat(stateRef.prevNotice);
              stateRef.newDataTaskId = setTimeout(() => {
                setNotice(notice => ({
                  ...notice,
                  data: stateRef.prevNotice,
                  open: true
                }));
                stateRef.prevNotice = [];
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
            if (data.data.length) handleNotice(data.data);
            else setShowEnd(false);
            setData(prop);
          }
        }
      }),
      [data, noticeDelay, noticeDuration]
    );
    useEffect(() => {
      setData(data => {
        if (autoFetch !== "pending") {
          if (autoFetch) {
            if (
              data.paging ? isIntersecting && data.paging.nextCursor : !!url
            ) {
              if (!stateRef.current.initFetch) {
                stateRef.current.initFetch = true;
                console.log(data, isIntersecting, " before infinite fetch...");
                (async () => {
                  try {
                    setLoading(true);
                    let _data = await http.get(
                      url +
                        `?limit=${limit}&cursor=${data.paging?.nextCursor ||
                          ""}&${
                          searchParams
                            ? searchParams
                            : dataKey
                            ? `select=${dataKey}`
                            : ""
                        }`,
                      {
                        withCredentials: true,
                        ...httpConfig
                      }
                    );
                    if (dataKey) _data = _data[dataKey];

                    console.log("got more scroll content", data.paging, _data);

                    data = {
                      ..._data,
                      data:
                        !defaultData || data.paging
                          ? data.data.concat(_data.data)
                          : _data.data
                    };
                    setData(data);
                    handleAction &&
                      _data.data.length &&
                      handleAction("new", _data);
                  } catch (message) {
                    setData(prev => ({ ...prev, paging: {} }));
                    setSnackBar(message);
                  } finally {
                    stateRef.current.initFetch = false;
                    // prevent requesting data before next observed target renders
                    resetState();
                    setLoading(false);
                  }
                })();
              }
            } else setLoading(false);
          } else {
            setLoading(false);
            data.data.length && handleAction("new", data);
            console.log("not fetching... ", data);
          }
        }
        // console.log(data);
        return data;
      });
    }, [
      url,
      limit,
      isIntersecting,
      autoFetch,
      setSnackBar,
      resetState,
      searchParams,
      handleAction,
      httpConfig,
      dataKey,
      defaultData
    ]);

    useEffect(() => {
      if (observedNode) {
        setTimeout(() => {
          setNotice(prev => ({
            ...prev,
            open: true
          }));
          setTimeout(() => {
            setNotice(prev => ({
              ...prev,
              open: false
            }));
          }, 10000);
        }, 2000);
        setShowEnd(
          showEndElement ? isOverflowing(containerRef?.current, root) : false
        );
      }
    }, [containerRef, observedNode, showEndElement, root]);
    if (ref) {
      propMemo.container = containerRef.current;
      ref.current = propMemo;
      if (ref) ref.current.data = data;
    }
    return (
      <Box
        sx={{
          // height: "100%",
          // maxHeight: "inherit",
          ...sx
        }}
      >
        {!hideDataNotifier && notice.data.length ? (
          <NoticeComponent
            containerRef={root || containerRef}
            // open={notice.open}
            data={notice.data}
            message={notice.message}
          />
        ) : null}
        <Box
          ref={containerRef}
          component={Component}
          {...componentProps}
          className="data-scrollable-container"
        >
          {loading ? (
            <Loading />
          ) : (
            <div
              style={{
                height: "inherit",
                minHeight: "inherit"
                // border: "1px solid blue"
              }}
            >
              {children(propMemo)}
            </div>
          )}
          {data.paging && !data.paging.nextCursor && showEnd ? (
            endElement ? (
              endElement
            ) : (
              <Typography color="primary.dark" variant="h6" textAlign="center">
                looks like you have reached the end!
              </Typography>
            )
          ) : null}
        </Box>
      </Box>
    );
  }
);

InfiniteScroll.propTypes = {};

export default InfiniteScroll;
