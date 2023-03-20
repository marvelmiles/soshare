import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import Short from "./Short";
import { Typography, Stack } from "@mui/material";
import { useContext } from "redux/store";
import http from "api/http";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import useInfiniteScroll from "hooks/useInfiniteScroll";
import InfiniteScroll from "./InfiniteScroll";
import { isOverflowing } from "utils";
import Box from "@mui/material/Box";
const ShortsWidget = React.forwardRef(
  (
    {
      title,
      children,
      miniShort = true,
      type = "",
      plainWidget,
      hideDataNotifier,
      infiniteScrollProps,
      url = "/shorts",
      loop,
      sx,
      mx,
      centerEmptyText
    },
    ref
  ) => {
    const currentUser = useSelector(state => state.user.currentUser);
    const { socket } = useContext();
    const [searchParams] = useSearchParams();
    const infiniteScrollRef = useRef();
    const containerRef = useRef();
    const _stateRef = useRef({});
    useEffect(() => {
      socket.on("feed-short", short => {
        console.log("feed shorts..");
        if (socket.shortId === short.id) return;
        socket.shortId = short.id;
        switch (short.visibility) {
          case "everyone":
            _handleAction("new", short);
            break;
          case "followers":
            if (currentUser.following.includes(short.user.id)) {
              _handleAction("new", short);
            }
            break;
          case "following":
            if (currentUser.followers.includes(short.user.id)) {
              _handleAction("new", short);
            }
            break;
          default:
            short.user.id === currentUser.id && _handleAction("new", short);
            break;
        }
      });
      socket.on("filter-short", id => {
        console.log("filter shor...");
        _handleAction("filter", id);
      });
      return () => {
        delete socket.shortId;
      };
    }, [socket, currentUser]);
    useEffect(() => {
      let date = new Date();
      let sec = date.getSeconds();
      let taskId;
      setTimeout(() => {
        taskId = setInterval(() => {
          // do something
          console.log("a minute reached...");
          infiniteScrollRef.current.setData(prev => {
            return {
              ...prev,
              data: prev.data.filter(({ createdAt }) => {
                const start = new Date();
                start.setDate(start.getDate() - 1);
                const date = new Date(createdAt);
                const t = date.getTime() >= start.getTime();
                console.log(
                  start,
                  date.getTime(),
                  start.getTime(),
                  t,
                  " timer "
                );
                return t;
              })
            };
          });
        }, 60 * 1000);
      }, (60 - sec) * 1000);
      return () => {
        taskId && clearInterval(taskId);
      };
    }, []);
    const _handleAction = (reason, short, uid, cacheData = true) => {
      const { setData } = infiniteScrollRef.current;
      let length;
      setData(prev => {
        switch (reason) {
          case "new":
            if (!length) length = prev.data.length + 1;
            if (prev.data.length >= length) return prev;
            if (_stateRef.current.cachedData) {
              if (short)
                _stateRef.current.cachedData = {
                  ..._stateRef.current.cachedData,
                  ...short
                };
              prev.data.splice(
                _stateRef.current.cachedIndex,
                0,
                _stateRef.current.cachedData
              );
              console.log(prev, " test roen...");
              _stateRef.current.cachedData = undefined;
            } else prev.data = [short, ...prev.data];
            break;
          case "filter":
            if (!length) length = prev.data.length - 1;
            if (prev.data.length <= length) return prev;
            prev.data = prev.data.filter((s, i) => {
              if (s.user.id === uid) return false;
              else if (s.id === short) {
                if (cacheData) {
                  _stateRef.current.cachedData = s;
                  _stateRef.current.cachedIndex = i;
                }
                return false;
              } else return true;
            });
            break;
          case "claer-cache":
            _stateRef.current.cachedData = undefined;
            _stateRef.current.cachedIndex = undefined;
            break;
          case "update":
            console.log(short.pause, "update...");
            prev.data = prev.data.map(s =>
              s.id === short.id ? { ...s, ...short } : s
            );
            break;
          default:
            break;
        }
        return { ...prev };
      });
    };
    return (
      <InfiniteScroll
        url={url}
        hideDataNotifier={hideDataNotifier}
        defaultData={
          {
            // data: Array.from(new Array(30)),
            // paging: {}
          }
        }
        Component={WidgetContainer}
        componentProps={{
          $plainWidget: plainWidget,
          sx: sx,
          id: "ssss"
          // border: "1px solid red"
        }}
        {...infiniteScrollProps}
        ref={infiniteScrollRef}
      >
        {({ data: { data }, setObservedNode }) => {
          // console.log(data);
          // data = [];
          return (
            <>
              {title && miniShort && (
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  mb={2}
                  sx={{
                    wordBreak: "break-word"
                  }}
                >
                  {title}
                </Typography>
              )}

              <Stack
                flexWrap="wrap"
                justifyContent="normal"
                gap={"8px"}
                p={"0px"}
                sx={{
                  height: "inherit",
                  width: "inherit",
                  minHeight: "inherit",
                  minWidth: "inherit"
                }}
              >
                {data.length ? (
                  data.map((s, i) => (
                    <Short
                      loop={loop}
                      i={i}
                      key={i}
                      short={s}
                      handleAction={_handleAction}
                      miniShort={miniShort}
                      mx={mx}
                      ref={
                        i === data.length - (data.length > 4 ? 3 : 1)
                          ? node => node && setObservedNode(node)
                          : null
                      }
                    />
                  ))
                ) : (
                  <Stack
                    sx={
                      centerEmptyText && {
                        height: "inherit",
                        width: "100%",
                        minHeight: "inherit",
                        minWidth: "100%"
                        // border: "1px solid green"
                      }
                    }
                  >
                    <Typography
                      color="common.dark"
                      textAlign="center"
                      sx={{ border: "1px solid green", mx: "auto" }}
                    >
                      We're sorry, but there doesn't seem to be any data
                      available at the moment.
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </>
          );
        }}
      </InfiniteScroll>
    );
  }
);

ShortsWidget.propTypes = {};

export default ShortsWidget;
