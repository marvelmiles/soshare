import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import {
  StyledTypography,
  StyledLink,
  avatarProfileSx
} from "components/styled";
import { Link } from "react-router-dom";

const Person = React.forwardRef(
  (
    {
      mx,
      fluid,
      user = {},
      variant = "block",
      mb = 2,
      onBtnClick,
      btnLabel,
      disabled,
      isOwner,
      sx
    },
    ref
  ) => {
    switch (variant) {
      case "block":
        return (
          <Box
            ref={ref}
            sx={{
              backgroundColor: "background.paper",
              boxShadow: 5,
              borderRadius: 3,
              py: 4,
              px: 1,
              textAlign: "center",
              mb: 2,
              minHeight: "230px",
              maxHeight: "230px",
              width: {
                xs: "100%",
                s320: fluid ? "44%" : "100%",
                sm: fluid ? "44%" : "44%",
                s600: fluid ? "44%" : "28%",
                md: "28%",
                lg: fluid ? "44%" : "28%"
              },
              mx: fluid
                ? {
                    xs: "0",
                    s360: "9px",
                    s400: "11px",
                    sm: "16px",
                    md: "19px",
                    s820: "23px",
                    lg: "12px"
                  }
                : {
                    md: "3px"
                  },
              ...sx
            }}
          >
            <Avatar
              sx={{
                mx: "auto",
                width: "50px",
                height: "50px",
                ...avatarProfileSx
              }}
              src={user.photoUrl}
            />
            <StyledTypography
              variant="h5"
              component={StyledLink}
              color="inherit"
              to={`/u/${user.id}`}
              pt="16px"
              maxLine={3}
            >
              {isOwner ? "You" : `@${user.displayName || user.username}`}
            </StyledTypography>
            {btnLabel ? (
              <Button
                variant="contained"
                sx={{
                  borderRadius: 4,
                  mt: "16px"
                }}
                onClick={e => {
                  e.stopPropagation();
                  onBtnClick(user, e);
                }}
                disabled={isOwner || disabled}
              >
                {btnLabel}
              </Button>
            ) : null}
          </Box>
        );
      default:
        return (
          <Stack
            ref={ref}
            alignItems="flex-start"
            sx={{
              mb,
              flexWrap: "wrap",
              width: "100%",
              ...sx
            }}
          >
            <Stack
              sx={{
                minWidth: {
                  xs: "100%",
                  s320: "50px"
                },
                flex: 1
              }}
              alignItems="flex-start"
              justifyContent="normal"
            >
              <Avatar
                variant="md"
                src={user.photoUrl}
                component={Link}
                to={`/u/${user.id}`}
                sx={avatarProfileSx}
              />
              <Box
                sx={{
                  minWidth: 0,
                  "& > *": {
                    display: "flex"
                  }
                }}
              >
                <Box>
                  <StyledTypography
                    fontWeight="500"
                    variant="caption"
                    color="common.dark"
                    textEllipsis
                  >
                    {isOwner ? "You" : user.displayName || user.username}
                  </StyledTypography>
                </Box>
                <Box>
                  <StyledTypography
                    variant="caption"
                    color="common.dark"
                    textEllipsis
                    sx={{ minWidth: 0, flex: 1 }}
                    component={StyledLink}
                    color="inherit"
                    to={`/u/${user.id}`}
                  >
                    @{user.username}
                  </StyledTypography>
                </Box>
              </Box>
            </Stack>
            {btnLabel ? (
              <Button
                variant={{}[variant] || "contained"}
                sx={{
                  borderRadius: 6,
                  flexShrink: 0
                }}
                onClick={e => onBtnClick(user, e)}
                disabled={isOwner || disabled}
              >
                {btnLabel}
              </Button>
            ) : null}
          </Stack>
        );
    }
  }
);

Person.propTypes = {};

export default Person;
