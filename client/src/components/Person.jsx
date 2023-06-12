import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import { StyledTypography, StyledLink } from "./styled";
import { Link } from "react-router-dom";

const Person = React.forwardRef(
  (
    {
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
              width: "30%",
              textAlign: "center",
              mb: 2,
              minHeight: "200px",
              ...sx
            }}
          >
            <Avatar variant="md" sx={{ mx: "auto" }} src={user.photoUrl} />
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
                onClick={onBtnClick}
                disabled={isOwner || disabled}
              >
                {btnLabel}
              </Button>
            ) : null}
          </Box>
        );
      default:
        return (
          <>
            {user.id}
            <Stack
              ref={ref}
              alignItems="flex-start"
              sx={{
                mb,
                flexWrap: "wrap",
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
                  onClick={onBtnClick}
                  disabled={isOwner || disabled}
                >
                  {btnLabel}
                </Button>
              ) : null}
            </Stack>
          </>
        );
    }
  }
);

Person.propTypes = {};

export default Person;
