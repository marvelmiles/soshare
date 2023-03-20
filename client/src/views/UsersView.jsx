import React, { useState } from "react";
import PropTypes from "prop-types";
import FollowMe from "components/FollowMe";
import Stack from "@mui/material/Stack";
import InfiniteScroll from "components/InfiniteScroll";
import { WidgetContainer } from "components/styled";
const UsersView = ({
  infiniteScrollProps,
  hideDataNotifier,
  plainWidget = true
}) => {
  const [users, setUsers] = useState(Array.from(new Array(40)));
  return (
    <InfiniteScroll
      hideDataNotifier={hideDataNotifier}
      root={document.documentElement}
      Component={WidgetContainer}
      componentProps={{
        $plainWidget: plainWidget
      }}
      defaultData={users}
      {...infiniteScrollProps}
    >
      {({ data: { data } }) => {
        return (
          <Stack flexWrap="wrap" justifyContent="normal" gap={2} pt={1}>
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
