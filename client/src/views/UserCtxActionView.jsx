import React, { useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import InfiniteScroll from "components/InfiniteScroll";
import Stack from "@mui/material/Stack";
import EmptyData from "components/EmptyData";
import Person from "components/Person";
import useContextDispatch from "hooks/useContextDispatch";
import { useContext } from "context/store";
import useCallbacks from "hooks/useCallbacks";
import { v4 as uniq } from "uuid";

const UserCtxActionView = React.forwardRef(
  (
    {
      emptyLabel,
      infiniteScrollProps,
      whitelistAll,
      dataKey,
      handleAction: onSuccess
    },
    ref
  ) => {
    const { socket } = useContext();
    const infiniteScrollRef = useRef();
    const { _handleAction } = useCallbacks(infiniteScrollRef);

    const { handleContextKeyDispatch, activeMap } = useContextDispatch({
      handleAction: onSuccess
    });

    const handleAction = useCallback(
      ({ username, id }) => {
        handleContextKeyDispatch(
          `/users/whitelist/${
            { _disapprovedUsers: "disapprove", _blockedUsers: "block" }[dataKey]
          }`,
          dataKey,
          {
            whitelist: true,
            setData: infiniteScrollRef.current.setData,
            username,
            id,
            users:
              !username && infiniteScrollRef.current.data.data.map(u => u.id)
          }
        );
      },
      [handleContextKeyDispatch, dataKey]
    );
    useEffect(() => {
      whitelistAll && handleAction({});
    }, [whitelistAll, handleAction]);

    useEffect(() => {
      if (socket) {
        const handleUpdate = user =>
          _handleAction("update", { document: user });
        socket.on("update-user", handleUpdate);
        return () => {
          socket.removeListener("update-user", handleUpdate);
        };
      }
    }, [_handleAction, socket]);

    return (
      <InfiniteScroll
        key={`${dataKey}-user-ctx-action-view`}
        {...infiniteScrollProps}
        ref={props => {
          infiniteScrollRef.current = props;
          ref && (ref.current = props);
        }}
        allowCancelRequest={false}
      >
        {({ data: { data } }) => {
          return (
            <div>
              {data.length ? (
                <Stack
                  flexWrap="wrap"
                  p={2}
                  pl={3}
                  pb={0}
                  justifyContent="normal"
                  gap={5}
                >
                  {data.map((u, i) => (
                    <Person
                      key={i}
                      user={u}
                      onBtnClick={handleAction}
                      btnLabel={"Whitelist"}
                      disabled={activeMap[u.id]}
                    />
                  ))}
                </Stack>
              ) : (
                <EmptyData label={emptyLabel} />
              )}
            </div>
          );
        }}
      </InfiniteScroll>
    );
  }
);

UserCtxActionView.propTypes = {};

export default UserCtxActionView;
