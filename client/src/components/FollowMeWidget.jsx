import React, { useState } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import { Typography } from "@mui/material";
import FollowMe from "./FollowMe";

const FollowMeWidget = props => {
  const [users, setUsers] = useState(Array.from(new Array(20)));
  return (
    <WidgetContainer
      sx={{
        height: "360px",
        overflow: "auto"
      }}
    >
      <Typography variant="h5" fontWeight="bold" mb={2}>
        People to follow
      </Typography>
      {users.map((u, i) => (
        <FollowMe user={u} key={i} />
      ))}
    </WidgetContainer>
  );
};

FollowMeWidget.propTypes = {};

export default FollowMeWidget;
