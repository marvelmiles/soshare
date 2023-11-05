import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { reloadBrowser } from "utils";
import BrandIcon from "components/BrandIcon";

const EmptyData = ({
  centerEmptyText = true,
  onClick,
  label = `We're sorry, but there doesn't seem to be any data available at the
      moment.`,
  sx,
  className,
  nullifyBrand,
  withReload,
  maxWidth = "350px"
  // maxWidth = withReload ? "350px" : "350px"
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
            flex: 1,
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
      {withReload ? (
        <div>
          {nullifyBrand ? null : <BrandIcon staticFont sx={{ mb: 1 }} to="" />}
          <Typography variant="h5">
            Something went wrong, but don’t fret — let’s give it another shot.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 1 }}
            onClick={onClick || reloadBrowser}
          >
            {onClick ? "Retry" : "Reload"}
          </Button>
        </div>
      ) : onClick ? (
        <div>
          <Typography variant="h5" color="primary.main">
            Something went wrong. Try again.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 1, color: "primary.main" }}
            onClick={onClick}
          >
            Retry
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
