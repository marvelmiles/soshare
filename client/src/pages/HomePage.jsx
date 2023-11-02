import React from "react";
import { useSelector } from "react-redux";
import SosharePen from "components/SosharePen";
import PostsView from "views/PostsView";
import MainView from "views/MainView";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const cid = useSelector(state => (state.user.currentUser || {}).id);
  const navigate = useNavigate();

  return (
    <MainView
      borderline
      layoutProps={
        cid
          ? {
              fabIcon: <AddIcon />,
              handleFabAction: () => navigate("?compose=create-post")
            }
          : undefined
      }
    >
      <PostsView scrollNodeRef={null}>
        {cid ? <SosharePen docType="post" boldFont autoFocus={false} /> : null}
      </PostsView>
    </MainView>
  );
};

export default HomePage;
