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
const UserWidget = props => {
  return (
    <WidgetContainer>
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
              ssssssssssssssssssssEiusmod voluptate ut aliquip nisi.Ipsum id
              ipsum dolore eiusmod nostrud eiusmod eu aute.
            </StyledTypography>
            <StyledLink sx={{ color: "inherit" }}>following</StyledLink>
            <span>|</span>
            <StyledLink sx={{ color: "inherit" }}>followers</StyledLink>
          </Box>
        </Stack>
        <IconButton>
          <ManageAccountsOutlined />
        </IconButton>
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Box
        sx={{
          px: 2
        }}
      >
        <Stack sx={{ gap: 4, mt: 2, alignItems: "flex-start" }}>
          <LocationOnOutlinedIcon sx={{ color: "common.main" }} />
          <Typography sx={{ color: "common.main" }}>
            Proident dolore magna cillum qui nostrud minim est ut.Proident
            exercitation esse nulla labore
          </Typography>
        </Stack>
        <Stack sx={{ gap: 4, mt: 2, alignItems: "flex-start" }}>
          <WorkOutlinedIcon sx={{ color: "common.main" }} />
          <Typography sx={{ color: "common.main" }}>
            Proident dolore magna cillum qui nostrud minim est ut.Proident
            exercitation esse nulla labore
          </Typography>
        </Stack>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Box sx={{ px: 2 }}>
        <Stack>
          <Typography color="common.medium" fontWeight="500">
            Who's viewed your profile
          </Typography>
          <Typography color="common.main">{100000}</Typography>
        </Stack>
        <Stack sx={{ my: 2 }}>
          <Typography color="common.medium" fontWeight="500">
            Post impressions
          </Typography>
          <Typography color="common.main">{100000}</Typography>
        </Stack>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Box sx={{ px: 2 }}>
        <Typography variant="h5" color="common.main" fontWeight="500" mb="1rem">
          Social Profiles
        </Typography>
        <Stack alignItems="flex-start" gap={2}>
          <TwitterIcon sx={{ color: "common.main" }} />
          <div style={{ minWidth: "100px" }}>
            <Typography color="common.main" fontWeight="500">
              TwitterinssssLorem deserunt mollit esse aliquip laboris
              reprehenderit est magna. Ullamco elit ipsum nostrud velit
              exercitation quis enim. Velit amet pariatur duis deserunt elit
              reprehenderit laboris ex sint irure tempor veniam mollit ea. Qui
              tempor pariatur sint minim duis consectetur.
            </Typography>
            <Typography color="common.medium">Social Network</Typography>
          </div>
          <IconButton>
            <EditOutlined sx={{ color: "common.main" }} />
          </IconButton>
        </Stack>
        <Stack sx={{ my: 2, gap: 2, alignItems: "flex-start" }}>
          <LinkedInIcon sx={{ color: "common.main" }} />
          <div style={{ minWidth: "100px" }}>
            <Typography color="common.main" fontWeight="500">
              LinkedIn
            </Typography>
            <Typography color="common.medium">Network Platform</Typography>
          </div>
          <IconButton>
            <EditOutlined sx={{ color: "common.main" }} />
          </IconButton>
        </Stack>
      </Box>
    </WidgetContainer>
  );
};

UserWidget.propTypes = {};

export default UserWidget;
