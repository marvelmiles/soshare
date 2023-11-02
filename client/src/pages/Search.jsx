import React from "react";
import { useSearchParams } from "react-router-dom";
import Tabs from "components/Tabs";
import PostsView from "views/PostsView";
import ShortsView from "views/ShortsView";
import MainView from "views/MainView";
import FollowMeView from "views/FollowMeView";
import Box from "@mui/material/Box";

const Search = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const tabsPane = [
    { value: "posts", label: "Posts" },
    { value: "users", label: "Users" },
    { value: "shorts", label: "Shorts" }
  ];

  return (
    <MainView
      borderline
      sx={{
        ".react-multi-carousel-list,.react-multi-carousel-track,.react-multi-carousel-track li": {
          minHeight: "calc(100vh - 120px)"
        }
      }}
    >
      <Tabs tabsPane={tabsPane} defaultTab="posts">
        {({ tab }) => {
          const emptyLabel = (
            <div>
              We are sorry it seems there is no {tab.slice(0, -1)}{" "}
              <Box component="span" sx={{ color: "primary.light" }}>
                {q ? `matching "${q}"` : ""} at the moment
              </Box>
              .
            </div>
          );

          const widgetProps = {
            plainWidget: true
          };

          const infiniteScrollProps = {
            dataKey: tab,
            searchParams: `q=${q}`,
            url: "/search",
            scrollNodeRef: null
          };

          return [
            <PostsView
              emptyLabel={emptyLabel}
              infiniteScrollProps={{
                ...infiniteScrollProps,
                readyState: tab === "posts" ? "ready" : "pending"
              }}
              key={"serach-posts"}
            />,
            <FollowMeView
              excludeCUser
              emptyLabel={emptyLabel}
              variant="block"
              infiniteScrollProps={{
                ...infiniteScrollProps,
                readyState: tab === "users" ? "ready" : "pending",
                verify: "t"
              }}
              key={"serach-users"}
              widgetProps={widgetProps}
            />,
            <ShortsView
              emptyLabel={emptyLabel}
              infiniteScrollProps={{
                ...infiniteScrollProps,
                readyState: tab === "shorts" ? "ready" : "pending"
              }}
              componentProps={widgetProps}
              key={"serach-shorts"}
            />
          ];
        }}
      </Tabs>
    </MainView>
  );
};

export default Search;
