import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import PostWidget from "./PostWidget";
import http from "api/http";
const PostsView = props => {
  const [posts, setPosts] = useState(Array.from(new Array(20)));
  useEffect(() => {
    (async () => {
      try {
        // console.log(
        //   await http.get("/posts", {
        //     withCredentials: true
        //   })
        // );
      } catch (err) {}
    })();
  });
  return (
    <div>
      {posts.map((p, i) => (
        <PostWidget maxHeight="none" key={i} />
      ))}
    </div>
  );
};

PostsView.propTypes = {};

export default PostsView;
