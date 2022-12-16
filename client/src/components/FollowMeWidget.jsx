import React, { useState } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import { Typography } from "@mui/material";
import FollowMe from "./FollowMe";

const FollowMeWidget = ({
  title = "People to follow",
  priority = "follow",
  width
}) => {
  const [users, setUsers] = useState(Array.from(new Array(20)));
  return (
    <WidgetContainer
      sx={{
        width,
        maxHeight: "600px",
        overflow: "auto"
      }}
    >
      <Typography variant="h5" fontWeight="bold" mb={2}>
        {title}
      </Typography>
      {users.map((u, i) => (
        <FollowMe user={u} key={i} />
      ))}
    </WidgetContainer>
  );
};

FollowMeWidget.propTypes = {};

export default FollowMeWidget;
