import React, { useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "components/styled";
import EmptyData from "components/EmptyData";
import Short from "components/Short";
import { Typography, Stack } from "@mui/material";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import InfiniteScroll from "components/InfiniteScroll";
import { checkVisibility } from "utils/validators";
const ShortsView = ({
  title,
  miniShort = true,
  plainWidget,
  infiniteScrollProps,
  url = "/shorts",
  loop,
  sx,
  mx,
  centerEmptyText,
  scrollNodeRef,
  privateView
}) => {
  plainWidget = plainWidget === undefined ? !miniShort : plainWidget;
  centerEmptyText = plainWidget ? true : centerEmptyText;
  const currentUser = useSelector(state => state.user.currentUser || {});
  const { socket, composeDoc, setComposeDoc } = useContext();
  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    cachedData: {},
    registeredIds: {},
    url
  });

  const _handleAction = useCallback(
    (reason, short, uid, cacheData = true) => {
      const { setData, data } = infiniteScrollRef.current;
      let entries = miniShort || reason !== "new" ? null : 1;
      switch (reason) {
        case "new":
          console.log(" in view ");
          const _id = short.id || short;
          if (stateRef.current.registeredIds[_id]) return;
          stateRef.current.registeredIds[_id] = _id;
          if (stateRef.current.cachedData[_id]) {
            data.data.splice(
              stateRef.current.cachedData[_id].index,
              0,
              stateRef.current.cachedData[_id].data
            );
            delete stateRef.current.cachedData[_id];
            entries = undefined;
          } else data.data = [short, ...data.data];
          break;
        case "filter":
          data.data = data.data.filter((s, i) => {
            if (s.id === short || s.user.id === uid) {
              delete stateRef.current.registeredIds[short];
              if (cacheData)
                stateRef.current.cachedData[short] = {
                  index: i,
                  data: s
                };
              return false;
            }
            return true;
          });
          break;
        case "clear-cache":
          delete stateRef.current.cachedData[short];
          delete stateRef.current.registeredIds[short];
          break;
        case "update":
          data.data = data.data.map(s =>
            s.id === short.id ? { ...s, ...short } : s
          );
          break;
        default:
          break;
      }
      setData(
        {
          ...data
        },
        entries
      );
    },
    [miniShort]
  );
  useEffect(() => {
    socket.on("short", short => {
      if (!checkVisibility(short, currentUser)) return;
      _handleAction("new", short);
    });
    socket.on("filter-short", id => {
      _handleAction("filter", id);
    });
  }, [socket, currentUser, _handleAction]);
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
    if (composeDoc) {
      switch (composeDoc.reason) {
        case "blacklisted-user":
          _handleAction(composeDoc.action, composeDoc.id, composeDoc.user.id);
          break;
        default:
          if (composeDoc.docType === "short" && composeDoc.document)
            _handleAction("update", composeDoc.document);
          break;
      }
    }

    return () => {
      if (timeId) {
        clearTimeout(timeId);
        taskId && clearInterval(taskId);
      }
      if (composeDoc?.docType === "short") setComposeDoc(undefined);
    };
  }, [composeDoc, setComposeDoc, _handleAction]);

  return (
    <InfiniteScroll
      url={stateRef.current.url}
      Component={WidgetContainer}
      componentProps={{
        plainWidget,
        sx: sx
      }}
      notifierDelay={composeDoc?.user.id === currentUser.id ? -1 : undefined}
      {...infiniteScrollProps}
      ref={infiniteScrollRef}
      verify={!miniShort}
      searchId={
        miniShort
          ? undefined
          : composeDoc?.docType === "short" &&
            composeDoc.reason === "fetch" &&
            composeDoc.id
      }
      handleAction={_handleAction}
      name="shorts"
      scrollNodeRef={scrollNodeRef}
      key={"infinite-shorts-" + miniShort}
      withCredentials={!!currentUser.id}
      handleAction={_handleAction}
    >
      {({ data: { data, paging }, setObservedNode }) => {
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
              flexWrap="wrap"
              justifyContent="normal"
              alignItems="flex-start"
              gap={"8px"}
              p={plainWidget ? 2 : 0}
            >
              {data.map((s, i) => (
                <div
                  key={i + miniShort}
                  ref={
                    i === data.length - 1
                      ? node => setObservedNode(node)
                      : undefined
                  }
                >
                  {s.id} {s.text} {data.length}
                  <Short
                    loop={loop}
                    i={i}
                    key={i + miniShort}
                    short={s}
                    handleAction={_handleAction}
                    miniShort={miniShort}
                    mx={mx}
                    paging={paging}
                  />
                </div>
              ))}
            </Stack>
          </>
        ) : (
          <EmptyData
            label={
              privateView
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
