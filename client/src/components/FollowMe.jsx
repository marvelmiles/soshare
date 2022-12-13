import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { StyledTypography } from "./styled";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
const FollowMe = props => {
  return (
    <Stack
      alignItems="flex-start"
      sx={{
        mb: 3,
        flexWrap: "wrap"
      }}
    >
      <Stack
        sx={{
          minWidth: 30,
          gap: 2
        }}
        alignItems="flex-start"
      >
        <Avatar variant="md" />
        <Box
          sx={{
            minWidth: 30,
            maxWidth: {
              xs: "345px",
              s640: "410px"
            }
          }}
        >
          <StyledTypography variant="h6" textEllipsis color="common.dark">
            user name
          </StyledTypography>
          <Typography
            color="common.medium"
            sx={{
              wordBreak: "break-word"
            }}
          >
            Neywork/city
          </Typography>
        </Box>
      </Stack>
      <Button
        variant="contained"
        sx={{
          borderRadius: 6,
          boxShadow: "none",
          color: "primary.dark",
          backgroundColor: "primary.light",
          backgroundImage: "none",
          "&:hover": {
            backgroundColor: "primary.light",
            boxShadow: "none"
          },
          flexShrink: 0
        }}
      >
        Follow
      </Button>
    </Stack>
  );
};

FollowMe.propTypes = {};

export default FollowMe;
