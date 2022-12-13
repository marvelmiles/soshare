import React, { useState } from "react";
import PropTypes from "prop-types";
import PostWidget from "./PostWidget";

const PostsView = props => {
  const [posts, setPosts] = useState([Array.from(new Array(30))]);
  return (
    <div>
      {posts.map((p, i) => (
        <PostWidget key={i} />
      ))}
    </div>
  );
};

PostsView.propTypes = {};

export default PostsView;
