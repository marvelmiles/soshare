import React, { useState } from "react";
import PropTypes from "prop-types";
import FollowMe from "components/FollowMe";
import Stack from "@mui/material/Stack";
import InfiniteScroll from "components/InfiniteScroll";
const UsersView = ({ infiniteScrollProps }) => {
  const [users, setUsers] = useState(Array.from(new Array(40)));
  return (
    <InfiniteScroll defaultData={users} {...infiniteScrollProps}>
      {({ data: { data } }) => {
        return (
          <Stack flexWrap="wrap" justifyContent="normal" gap={2} p={2}>
            {data.map((u, i) => (
              <FollowMe user={u} variant="block" key={i} />
            ))}
          </Stack>
        );
      }}
    </InfiniteScroll>
  );
};

UsersView.propTypes = {};

export default UsersView;
