import React, { useRef, useCallback } from "react";
import PropTypes from "prop-types";
import Tabs from "components/Tabs";
import UserCtxActionView from "views/UserCtxActionView";
import SearchInput from "components/SearchInput";
import { debounce } from "@mui/material";
import ReactDOM from "react-dom";

const withDebounceFn = debounce(cb => cb(), 400);

const UserBlacklistView = ({
  scrollNodeRef,
  searchInputPortalRef,
  handleAction,
  whitelistAll,
  ...rest
}) => {
  const infiniteScrollRef = useRef();
  const stateRef = useRef({});

  const handleChange = useCallback((v = "", { setLoading }) => {
    stateRef.current.typed = true;
    const props = infiniteScrollRef.current;

    props.cancelRequest();

    let nextIndex;

    const config = {
      searchParams: `q=${v}`
    };

    const data = stateRef.current.data;

    const filterUser = () => {
      props.setData(data => {
        return {
          ...data,
          data: data.data.filter(({ username = "", displayName = "" }, i) => {
            if (new RegExp(v, "i").test(username + displayName)) {
              // if (data.paging.nextCursor)
              //   nextIndex = i === data.data.length - 1 ? i : i + 1;
              return true;
            }
            return false;
          })
        };
      }, config);
    };

    // stateRef.current.data.data[nextIndex] &&
    //   (data.paging.nextCursor =
    //     stateRef.current.data.data[nextIndex].id);

    withDebounceFn(() => {
      if (data && data.data.length) {
        if (!v) {
          props.setData({ ...data }, config);
          setLoading(false);
          if (data.data.length === props.infinitePaging.totalDoc) return;
        } else filterUser();
      } else if (v) filterUser();

      props.refetch((err, cData) => {
        if (cData) {
          if (!data) stateRef.current.data = cData;
        }
        setLoading(false);
      }, config);
    });
  }, []);

  const onBeforeChange = useCallback(
    tab => {
      // if (!stateRef.current.cancelRequest) return;

      // stateRef.current.cancelRequest();

      handleAction &&
        handleAction("tabChanged", {
          tab,
          isBefore: true,
          dataSize: 0
        });
    },
    [handleAction]
  );

  const onAfterChange = useCallback(
    tab => {
      const props = infiniteScrollRef.current;

      if (props.preventFetch) props.refetch();

      handleAction &&
        handleAction("tabChanged", {
          tab,
          isBefore: false,
          dataSize: props.data.data.length
        });
    },
    [handleAction]
  );

  const tabsPane = [
    {
      value: "recommendation",
      label: "Recommendation"
    },
    {
      value: "blocked",
      label: "Blocked"
    }
  ];

  return (
    <Tabs
      tabsPane={tabsPane}
      cacheParam="search"
      defaultTab="recommendation"
      deleteParams={"search"}
      onBeforeChange={onBeforeChange}
      onAfterChange={onAfterChange}
      renderSectionEl={({ tab, defaultValue }) => {
        const portal = searchInputPortalRef.current;

        const search = (
          <SearchInput
            key={tab}
            autoFocus
            defaultValue={defaultValue}
            onChange={handleChange}
            sx={searchInputPortalRef ? { display: "none" } : undefined}
          />
        );

        return portal ? ReactDOM.createPortal(search, portal) : search;
      }}
    >
      {({ tab, tabChanged, defaultValue }) => {
        const infiniteScrollProps = {
          scrollNodeRef,
          dataKey: tab,
          url: `/users/blacklist`,
          verify: "h",
          withCredentials: true,
          handleAction,
          searchParams: stateRef.current.typed ? "" : `q=${defaultValue}`
        };

        const emptyLabel = <div>Blacklist is empty</div>;

        const isRec = tab === "recommendation";

        if (tabChanged)
          stateRef.current.cancelRequest =
            infiniteScrollRef.current.cancelRequest;

        return [
          <UserCtxActionView
            key={0}
            dataKey="_disapprovedUsers"
            emptyLabel={emptyLabel}
            whitelistAll={isRec && whitelistAll}
            {...rest}
            ref={isRec ? infiniteScrollRef : undefined}
            handleAction={handleAction}
            infiniteScrollProps={{
              ...infiniteScrollProps,
              // verify: "y",
              readyState: tab === "recommendation" ? "ready" : "pending"
            }}
          />,
          <UserCtxActionView
            key={1}
            dataKey="_blockedUsers"
            emptyLabel={emptyLabel}
            whitelistAll={!isRec && whitelistAll}
            handleAction={handleAction}
            {...rest}
            ref={!isRec ? infiniteScrollRef : undefined}
            infiniteScrollProps={{
              ...infiniteScrollProps,
              verify: "y",
              readyState: !isRec ? "ready" : "pending"
            }}
          />
        ];
      }}
    </Tabs>
  );
};

UserBlacklistView.propTypes = {};

export default UserBlacklistView;
