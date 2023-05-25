import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const EmptyData = ({
  centerEmptyText = true,
  onClick,
  label = `We're sorry, but there doesn't seem to be any data available at the
      moment.`,
  maxWidth = "280px",
  sx,
  className
}) => (
  <Stack
    className={`custom-empty-data ${className}`}
    sx={
      centerEmptyText
        ? {
            height: "inherit",
            width: "100%",
            minHeight: "inherit",
            minWidth: "100%",
            overflow: "hidden",
            ...sx
          }
        : sx
    }
  >
    <Typography
      variant="h6"
      color="primary.main"
      textAlign="center"
      sx={{
        mx: "auto",
        mt: !centerEmptyText && 3,
        maxWidth,
        width: "100%"
      }}
    >
      {onClick ? (
        <div>
          <Typography variant="h5">Something went wrong. Try again</Typography>
          <Button variant="contained" sx={{ mt: 1 }} onClick={onClick}>
            Reload
          </Button>
        </div>
      ) : (
        label
      )}
    </Typography>
  </Stack>
);

EmptyData.propTypes = {};

export default EmptyData;
