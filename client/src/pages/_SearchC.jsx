import React, { useRef, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Carousel from "react-multi-carousel";
import PostsView from "views/PostsView";
import ShortsView from "views/ShortsView";
import MainView from "views/MainView";
import FollowMeWidget from "views/FollowMeView";
import { createRelativeURL } from "api/http";
import Loading from "components/Loading";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { q, tab } = useMemo(() => {
    let tab = (searchParams.get("tab") || "").toLowerCase();
    switch (tab) {
      case "posts":
      case "shorts":
      case "users":
        break;
      default:
        tab = "users";
    }
    return {
      tab,
      q: searchParams.get("q") || ""
    };
  }, [searchParams]);

  const carouselRef = useRef();
  const stateRef = useRef({
    withActiveTab: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (carouselRef.current) {
      console.log(tab, " effect tab.///");
      stateRef.current.withActiveTab = true;
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
  }, [tab]);

  const handleTabChange = (e, value) => {
    e && e.stopPropagation();
    stateRef.current.withActiveTab = false;
    navigate(createRelativeURL("tab", `tab=${value}`), {
      replace: true
    });
  };

  const withActiveTab = stateRef.current.withActiveTab;

  const emptyLabel = `We are sorry it seems there is no ${tab.slice(
    0,
    -1
  )} matching ${q}!`;

  console.log(withActiveTab, tab, tab === "users" && withActiveTab, "taby");

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
        onChange={handleTabChange}
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
          handleTabChange(undefined, ["posts", "users", "shorts"][current]);
        }}
      >
        <PostsView
          emptyLabel={emptyLabel}
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=posts`,
            url: `/search`,
            readyState: tab === "posts" && withActiveTab ? "ready" : "pending",
            verify: true,
            verify: "t",
            scrollNodeRef: null
          }}
          key={"serach-posts"}
        />
        <FollowMeWidget
          variant="block"
          emptyLabel={emptyLabel}
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=users`,
            url: `/search`,
            readyState: tab === "users" && withActiveTab ? "ready" : "pending",
            // verify: "t",
            scrollNodeRef: null
          }}
          key={"serach-users"}
          widgetProps={{
            plainWidget: true
          }}
        />
        <ShortsView
          infiniteScrollProps={{
            dataKey: tab,
            searchParams: `q=${q}&select=shorts`,
            url: `/search`,
            readyState: tab === "shorts" && withActiveTab ? "ready" : "pending",
            // verify: "t",
            scrollNodeRef: null
          }}
          componentProps={{
            plainWidget: true
          }}
          key={"serach-shorts"}
          emptyLabel={emptyLabel}
        />
      </Carousel>
    </MainView>
  );
};

export default Search;
