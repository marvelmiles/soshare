import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import InfiniteScroll from "components/InfiniteScroll";
import Stack from "@mui/material/Stack";
import EmptyData from "components/EmptyData";
import Person from "components/Person";
import useContextDispatch from "hooks/useContextDispatch";
import { useContext } from "context/store";
import useCallbacks from "hooks/useCallbacks";

const UserCtxActionView = React.forwardRef(
  ({ ctxKey, emptyLabel, infiniteScrollProps }, ref) => {
    const { socket } = useContext();
    const infiniteScrollRef = useRef();
    const { _handleAction } = useCallbacks(infiniteScrollRef);

    const { handleContextKeyDispatch, activeMap } = useContextDispatch();

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

    const handleAction = ({ username, id }) =>
      handleContextKeyDispatch(
        `/users/whitelist/${
          { disapprovedUsers: "disapprove", blockedUsers: "block" }[ctxKey]
        }`,
        ctxKey,
        {
          whitelist: true,
          username,
          id,
          setData: infiniteScrollRef.current.setData
        }
      );

    return (
      <InfiniteScroll
        key={`${ctxKey}-user-ctx-action-view`}
        {...infiniteScrollProps}
        ref={props => {
          infiniteScrollRef.current = props;
          ref && (ref.current = props);
        }}
      >
        {({ data: { data } }) => {
          return (
            <div>
              {data.length ? (
                <Stack flexWrap="wrap" p={2} pb={0}>
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
