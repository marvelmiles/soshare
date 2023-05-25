import React, { useRef, useMemo, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Carousel from "react-multi-carousel";
import PostsView from "views/PostsView";
import ShortsView from "views/ShortsView";
import MainView from "views/MainView";
import FollowMeWidget from "components/FollowMeWidget";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo(
    () => (searchParams.get("tab") || "posts").toLowerCase(),
    [searchParams]
  );
  const q = useMemo(() => searchParams.get("q") || "", [searchParams]);

  const carouselRef = useRef();
  const stateRef = useRef({
    hasMounted: false
  }).current;
  useEffect(() => {
    if (carouselRef.current) {
      stateRef.hasMounted = true;
      carouselRef.current.goToSlide(
        {
          posts: 0,
          users: 1,
          shorts: 2
        }[tab],
        {
          skipAfterChange: true
        }
      );
    }
  }, [tab, stateRef]);
  if (!q) return <Navigate to={-1} />;
  const viewSx = {
    p: 0,
    minHeight: "inherit",
    height: "auto"
  };
  return (
    <MainView
      borderline
      sx={{
        ".react-multi-carousel-list,.react-multi-carousel-track,.react-multi-carousel-track li": {
          minHeight: "calc(100vh - 120px)"
        }
      }}
    >
      <Tabs
        value={tab}
        onChange={(e, value) => {
          searchParams.set("tab", value);
          setSearchParams(searchParams);
        }}
        variant="scrollable"
        sx={{
          "& .MuiTab-root": {
            flex: 1
          },
          borderBottomColor: "divider",
          ".MuiTabs-indicator": {
            bottom: "-1px"
          }
        }}
      >
        <Tab value="posts" label="Posts" wrapped />
        <Tab value="users" label="Users" wrapped />
        <Tab value="shorts" label="Shorts" wrapped />
      </Tabs>
      <Carousel
        arrows={false}
        responsive={{
          xs: {
            items: 1,
            breakpoint: { min: 0, max: Infinity }
          }
        }}
        ref={carouselRef}
        beforeChange={current => {
          searchParams.set(
            "tab",
            {
              0: "posts",
              1: "users",
              2: "shorts"
            }[current]
          );
          setSearchParams(searchParams);
        }}
      >
        <PostsView
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=posts`,
            url: `/search`,
            readyState: q
              ? tab === "posts" && stateRef.hasMounted
                ? "ready"
                : "pending"
              : false
          }}
          sx={viewSx}
          postSx={{
            "&:first-of-type": {
              borderTop: "1px solid currentColor",
              borderColor: "divider"
            }
          }}
          key={"serach-posts"}
        />
        <FollowMeWidget
          variant="block"
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=users`,
            url: `/search`,
            readyState:
              tab === "users" && stateRef.hasMounted ? "ready" : "pending",
            componentProps: {
              plainWidget: true
            }
          }}
          key={"serach-users"}
        />
        <ShortsView
          plainWidget
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=shorts`,
            url: `/search`,
            readyState:
              tab === "shorts" && stateRef.hasMounted ? "ready" : "pending"
          }}
          sx={viewSx}
          key={"serach-shorts"}
        />
      </Carousel>
    </MainView>
  );
};

export default Search;
