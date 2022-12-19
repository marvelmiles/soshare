import React from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import { Box, Stack, Avatar, Divider, IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import ManageAccountsOutlined from "@mui/icons-material/ManageAccountsOutlined";
import { StyledLink, StyledTypography } from "./styled";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WorkOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { useSelector } from "react-redux";

const UserWidget = ({ width, hideUserSettingsIcon }) => {
  const { currentUser, previewUser } = useSelector(state => {
    return state.user;
  });
  return (
    <WidgetContainer
      sx={{
        width
      }}
    >
      <Stack sx={{ gap: 2 }}>
        <Stack sx={{ minWidth: 0, gap: 2 }}>
          <Avatar variant="md" />
          <Box
            sx={{
              minWidth: 0,
              color: "common.medium",
              span: {
                mx: "2px"
              }
            }}
          >
            <StyledTypography
              variant="h5"
              fontWeight="bold"
              textEllipsis
              color="common.dark"
            >
              {(previewUser || currentUser).displayName}
            </StyledTypography>
            <div style={{ whiteSpace: "nowrap" }}>
              <StyledLink sx={{ color: "inherit" }}>following</StyledLink>
              <span>|</span>
              <StyledLink sx={{ color: "inherit" }}>followers</StyledLink>
            </div>
          </Box>
        </Stack>
        {hideUserSettingsIcon ? null : (
          <IconButton component={StyledLink} to="/u/profile">
            <ManageAccountsOutlined />
          </IconButton>
        )}
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Box
        sx={{
          px: 2
        }}
      >
        {(previewUser || currentUser).location ? (
          <Stack sx={{ gap: 4, mt: 2, alignItems: "flex-start" }}>
            <LocationOnOutlinedIcon sx={{ color: "common.main" }} />
            <Typography sx={{ color: "common.main" }}>
              {(previewUser || currentUser).location}
            </Typography>
          </Stack>
        ) : null}
        {(previewUser || currentUser).occuptation ? (
          <Stack sx={{ gap: 4, mt: 2, alignItems: "flex-start" }}>
            <WorkOutlinedIcon sx={{ color: "common.main" }} />
            <Typography sx={{ color: "common.main" }}>
              Proident dolore magna cillum qui nostrud minim est ut.Proident
              exercitation esse nulla labore
            </Typography>
          </Stack>
        ) : null}
      </Box>
      {(previewUser || currentUser).occuptation ||
      (previewUser || currentUser).location ? (
        <Divider sx={{ my: 3 }} />
      ) : null}
      <Box sx={{ px: 2 }}>
        <Stack>
          <Typography color="common.medium" fontWeight="500">
            Who's viewed your profile
          </Typography>
          <Typography color="common.main">
            {(previewUser || currentUser).views}
          </Typography>
        </Stack>
        <Stack sx={{ my: 2 }}>
          <Typography color="common.medium" fontWeight="500">
            Post impressions
          </Typography>
          <Typography color="common.main">
            {(previewUser || currentUser).impressions}
          </Typography>
        </Stack>
      </Box>
      {(previewUser || currentUser).socials ? (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ px: 2 }}>
            <Typography
              variant="h5"
              color="common.main"
              fontWeight="500"
              mb="1rem"
            >
              Social Profiles
            </Typography>
            {Object.keys((previewUser || currentUser).socials).map((s, i) => (
              <Stack alignItems="flex-start" gap={2} key={i}>
                <TwitterIcon sx={{ color: "common.main" }} />
                <div style={{ minWidth: "100px", flex: 1 }}>
                  <Typography color="common.main" fontWeight="500">
                    {(previewUser || currentUser).socials[s].url}
                  </Typography>
                  <Typography color="common.medium">
                    {{ twitter: "Social Network", linkedIn: "Linked" }[s]}
                  </Typography>
                </div>
                <IconButton component={StyledLink} to={`/u/profile#user-${s}`}>
                  <EditOutlined sx={{ color: "common.main" }} />
                </IconButton>
              </Stack>
            ))}
          </Box>
        </>
      ) : null}
    </WidgetContainer>
  );
};

UserWidget.propTypes = {};

export default UserWidget;
