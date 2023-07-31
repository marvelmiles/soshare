import React, { useRef, useCallback } from "react";
import PropTypes from "prop-types";
import Tabs from "components/Tabs";
import UserCtxActionView from "views/UserCtxActionView";
import SearchInput from "components/SearchInput";

const UserBlacklistView = ({ scrollNodeRef }) => {
  const infiniteScrollRef = useRef();
  const stateRef = useRef({
    recommendation: "",
    blocked: ""
  });

  const handleChange = useCallback((v, { setLoading }) => {
    stateRef.current.tab && (stateRef.current[stateRef.current.tab] = v);
    infiniteScrollRef.current.setData(data => {
      if (!stateRef.current.data) stateRef.current.data = data;
      if (v) {
        data = {
          ...data,
          data: data.data.filter(({ username = "", displayName = "" }) =>
            new RegExp(v, "i").test(username + displayName)
          )
        };
      } else data = { ...(stateRef.current.data || data) };

      return data;
    });
    setLoading(false);
  }, []);

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
      defaultTab="recommendation"
      deleteParams="search"
      sectionEl={({ tab }) => {
        stateRef.current.tab = tab;
        return (
          <SearchInput
            key={tab}
            defaultValue={stateRef.current[tab]}
            onChange={handleChange}
          />
        );
      }}
    >
      {({ tab }) => {
        const infiniteScrollProps = {
          scrollNodeRef,
          dataKey: tab,
          url: `/users/blacklist`,
          verify: "f",
          withCredentials: true
        };

        const emptyLabel = <div>Blacklist is empty</div>;

        return [
          <UserCtxActionView
            key="user-disapprove-view"
            ctxKey="disapprovedUsers"
            emptyLabel={emptyLabel}
            ref={infiniteScrollRef}
            infiniteScrollProps={{
              ...infiniteScrollProps,
              readyState: tab === "recommendation" ? "ready" : "pending"
            }}
          />,
          <UserCtxActionView
            key="user-block-view"
            ctxKey="blockedUsers"
            emptyLabel={emptyLabel}
            ref={infiniteScrollRef}
            infiniteScrollProps={{
              ...infiniteScrollProps,
              readyState: tab === "blocked" ? "ready" : "pending"
            }}
          />
        ];
      }}
    </Tabs>
  );
};

UserBlacklistView.propTypes = {};

export default UserBlacklistView;
