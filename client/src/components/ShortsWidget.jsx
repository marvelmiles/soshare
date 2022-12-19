import React, { useState } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import Short from "./Short";
import { Typography, Stack } from "@mui/material";

const ShortsWidget = ({ title = "Trending shorts", children }) => {
  const [shorts] = useState(Array.from(new Array(20)));
  return (
    <WidgetContainer>
      {title && (
        <Typography variant="h5" fontWeight="bold" mb={2}>
          {title}
        </Typography>
      )}
      <Stack flexWrap="wrap">
        {shorts.map((s, i) => (
          <Short key={i} />
        ))}
      </Stack>
      {children}
    </WidgetContainer>
  );
};

ShortsWidget.propTypes = {};

export default ShortsWidget;
