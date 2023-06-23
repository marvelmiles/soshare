import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "components/styled";
import EmptyData from "components/EmptyData";
import Short from "components/Short";
import { Typography, Stack } from "@mui/material";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import InfiniteScroll from "components/InfiniteScroll";
import useCallbacks from "hooks/useCallbacks";

const ShortsView = ({
  title,
  miniShort = true,
  infiniteScrollProps,
  url = "/shorts",
  loop,
  sx,
  mx,
  scrollNodeRef,
  privateUid,
  componentProps
}) => {
  const currentUser = useSelector(state => state.user.currentUser || {});
  const {
    socket,
    context: { composeDoc, blacklistedUsers, filterDocsByUserSet }
  } = useContext();

  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    url
  });

  const { _handleAction } = useCallbacks(infiniteScrollRef, {
    stateCtx: stateRef.current,
    currentUser
  });
  useEffect(() => {
    const handleFilter = document => {
      _handleAction("filter", { document, cacheData: false });
    };

    const handleAppend = short => {
      (privateUid ? privateUid === short.user.id : true) &&
        _handleAction("new", { document: short });
    };

    const handleUpdateUser = user => _handleAction("update", { user });

    socket.on("short", handleAppend);
    socket.on("filter-short", handleFilter);
    socket.on("update-user", handleUpdateUser);

    return () => {
      socket
        .removeEventListener("short", handleAppend)
        .removeEventListener("filter-short", handleFilter)
        .removeEventListener("update-user", handleUpdateUser);
    };
  }, [socket, _handleAction, privateUid]);

  useEffect(() => {
    let taskId, timeId;
    let date = new Date();
    let sec = date.getSeconds();
    timeId = setTimeout(() => {
      return;
      const filterOlders = () => {
        infiniteScrollRef.current.setData(prev => {
          return {
            ...prev,
            data: prev.data.filter(({ createdAt }) => {
              const start = new Date();
              start.setDate(start.getDate() - 1);
              const date = new Date(createdAt);
              return date.getTime() >= start.getTime();
            })
          };
        });
      };
      filterOlders();
      taskId = setInterval(filterOlders, 60 * 1000);
    }, (60 - sec) * 1000);

    if (composeDoc)
      switch (composeDoc.reason) {
        case "new":
          if (composeDoc.docType === "short")
            _handleAction("new", {
              document: composeDoc.document
            });
          break;
        default:
          break;
      }

    return () => {
      if (timeId) {
        clearTimeout(timeId);
        taskId && clearInterval(taskId);
      }
    };
  }, [composeDoc, _handleAction]);

  useEffect(() => {
    filterDocsByUserSet(infiniteScrollRef.current, blacklistedUsers);
  }, [blacklistedUsers, filterDocsByUserSet]);

  return (
    <InfiniteScroll
      key={"infinite-shorts-" + miniShort}
      url={stateRef.current.url}
      sx={
        miniShort
          ? {
              minHeight: undefined,
              ...sx
            }
          : sx
      }
      componentProps={componentProps}
      Component={miniShort ? WidgetContainer : undefined}
      notifierDelay={
        !currentUser.id || currentUser.id !== composeDoc?.document?.user?.id
          ? undefined
          : -1
      }
      {...infiniteScrollProps}
      ref={infiniteScrollRef}
      name="shorts"
      scrollNodeRef={scrollNodeRef}
      withCredentials={!!currentUser.id}
      readyState={
        composeDoc?.done === false ? "pending" : infiniteScrollProps?.readyState
      }
      searchId={
        composeDoc?.docType === "short"
          ? (composeDoc.url && composeDoc.document?.id) ||
            (composeDoc.reason === "search" && composeDoc.document.id)
          : undefined
      }
    >
      {({ data: { data }, setObservedNode }) => {
        return data.length ? (
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
              justifyContent={"normal"}
              alignItems="flex-start"
              sx={
                miniShort
                  ? {
                      flexWrap: "wrap"
                    }
                  : {
                      flexDirection: "column",
                      gap: {
                        xs: 0,
                        md: 2
                      },
                      py: {
                        xs: 0,
                        md: 1
                      }
                    }
              }
            >
              {data.map((s, i) => {
                return (
                  <Short
                    id={s.id}
                    key={i + miniShort}
                    stateCtx={stateRef.current}
                    ref={
                      i === data.length - 1
                        ? node => setObservedNode(node)
                        : undefined
                    }
                    loop={loop}
                    short={s}
                    handleAction={_handleAction}
                    miniShort={miniShort}
                    mx={mx}
                  />
                );
              })}
            </Stack>
          </>
        ) : (
          <EmptyData
            label={
              privateUid
                ? `You don't have any short at the moment!`
                : `We're sorry it seems there is no shorts at the moment`
            }
          />
        );
      }}
    </InfiniteScroll>
  );
};

ShortsView.propTypes = {};

export default ShortsView;
