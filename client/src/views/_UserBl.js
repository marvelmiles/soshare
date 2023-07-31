import React, { useCallback, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import InfiniteScroll from "components/InfiniteScroll";
import Person from "components/Person";
import { useSelector } from "react-redux";
import EmptyData from "components/EmptyData";
import { Stack } from "@mui/material";
import useWhitelistDispatch from "hooks/useWhitelistDispatch";

const UserBlacklistView = ({
  infiniteScrollProps,
  scrollNodeRef,
  handleAction,
  whitelistAll
}) => {
  const cid = useSelector(state => state.user.currentUser?.id);
  const infiniteRef = useRef();
  const stateRef = useRef({
    cachedData: {}
  });
  const _handleAction = useCallback(
    (reason, res) => {
      switch (reason) {
        case "data":
          handleAction &&
            handleAction("context", {
              dataSize: res.dataSize
            });
          break;
        case "filter":
          infiniteRef.current.setData({
            ...infiniteRef.current.data,
            data: infiniteRef.current.data.data.filter((data, i) => {
              if (res.includes(data.id)) {
                stateRef.current.cachedData[data.id] = {
                  data,
                  index: i
                };
                return false;
              }
              return true;
            })
          });

          break;
        case "clear-cache":
          res.forEach(id => delete stateRef.current.cachedData[id]);
          break;
        case "new":
          res.forEach(id => {
            const cache = stateRef.current.cachedData[id];
            if (cache) {
              infiniteRef.current.data.data.splice(cache.index, 0, cache.data);
            }
          });
          infiniteRef.current.setData({ ...infiniteRef.current.data });
          break;
        default:
          handleAction && handleAction(reason, res);
          break;
      }
    },
    [handleAction]
  );
  const { handleWhitelist } = useWhitelistDispatch();
  useEffect(() => {
    if (whitelistAll) {
      handleAction && handleAction("context", { action: undefined });
      handleWhitelist(infiniteRef.current.data.data.map(({ id }) => id), {
        dataSize: infiniteRef.current.data.data.length - 1,
        _handleAction
      });
    }
  }, [whitelistAll, handleWhitelist, _handleAction, handleAction]);
  return (
    <InfiniteScroll
      scrollNodeRef={scrollNodeRef}
      withCredentials={!!cid}
      {...infiniteScrollProps}
      handleAction={_handleAction}
      url={`/users/blacklist`}
      ref={infiniteRef}
      key="infinite-user-blacklist"
    >
      {({ data: { data }, setObservedNode }) => {
        return data.length ? (
          <Stack Stack flexWrap="wrap" justifyContent="normal" gap={2} p={2}>
            {data.map((u = {}, i) => (
              <Person
                ref={
                  i === data.length - 1
                    ? node => node && setObservedNode(node)
                    : undefined
                }
                isOwner={u.id === cid}
                user={u}
                key={u.id}
                btnLabel="Whitelist"
                onBtnClick={e => {
                  e.stopPropagation();
                  handleWhitelist([u.id], {
                    dataSize: infiniteRef.current.data.data.length - 1,
                    _handleAction
                  });
                }}
              />
            ))}
          </Stack>
        ) : (
          <EmptyData label="Blacklist is empty" />
        );
      }}
    </InfiniteScroll>
  );
};

UserBlacklistView.propTypes = {};

export default UserBlacklistView;
