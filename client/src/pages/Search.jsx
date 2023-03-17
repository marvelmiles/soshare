import React, { useState, useRef, useMemo, useEffect } from "react";
import Layout from "components/Layout";
import { useSearchParams } from "react-router-dom";
import http from "api/http";
import { useContext } from "redux/store";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import HomePage from "./HomePage";
import Carousel from "react-multi-carousel";
import PostsView from "components/PostsView";
import ShortsWidget from "components/ShortsWidget";
import UsersView from "views/UsersView";
import MainView from "views/MainView";

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
  }, [tab, stateRef]);
  return (
    <MainView
      sx={
        {
          // flexDirection: "row-reverse",
          // maxWidth: "1000px"
        }
      }
      ad
    >
      <Tabs
        value={tab}
        onChange={(e, value) => {
          searchParams.set("tab", value);
          setSearchParams(searchParams);
        }}
        variant="scrollable"
        sx={{
          // mb: 3,
          "& .MuiTab-root": {
            flex: 1
          },
          borderBottom: "1px solid red",
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
            autoFetch: tab === "posts" && stateRef.hasMounted ? true : "pending"
          }}
          sx={{
            p: 0
          }}
          postSx={{
            "&:first-of-type": {
              borderTop: "none"
            }
          }}
        />
        <UsersView
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=users`,
            url: `/search`,
            autoFetch: tab === "users" && stateRef.hasMounted ? true : "pending"
          }}
        />
        <ShortsWidget
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=shorts`,
            url: `/search`,
            autoFetch:
              tab === "shorts" && stateRef.hasMounted ? true : "pending"
          }}
          sx={{
            backgroundColor: "transparent"
          }}
        />
      </Carousel>
    </MainView>
  );
};

export default Search;
