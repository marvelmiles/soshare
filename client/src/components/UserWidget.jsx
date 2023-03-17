import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import { Box, Stack, Avatar, Divider, IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import ManageAccountsOutlined from "@mui/icons-material/ManageAccountsOutlined";
import { StyledLink, StyledTypography } from "components/styled";
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

const UserWidget = ({ width, user }) => {
  const previewUser = useSelector(({ user: { previewUser, currentUser } }) => {
    return {
      ...(user || currentUser),
      ...previewUser
      // bio: `CNulla excepteur laboris anim Lorem sit consectetur esse in consequat nostrud. Quis officia aliquip dolor officia deserunt culpa ex. Culpa quis veniam occaecat id dolore est. Eiusmod enim labore nisi consectetur amet et occaecat id incididunt ad velit. Incididunt quis aliquip sint id. Occaecat consectetur laboris id dolore aliqua.

      // Consequat nisi consectetur excepteur eiusmod Lorem. Nostrud culpa deserunt veniam dolor ipsum. Esse consectetur aute irure commodo. Do consequat enim nulla officia mollit mollit.`,
      // displayName: `Exercitation anim consequat mollit est tempor tempor amet fugiat magna tempor proident reprehenderit ut et.`,
      // socials: {
      //   twitter: {
      //     url: "h"
      //   },
      //   linkedIn: {
      //     url: "jj"
      //   }
      // },
      // occupation: "ss",
      // location: "jjjjjjjjjj"
    };
  });
  const userLink = `/u/${previewUser.id}`;

  const styles = {
    textValue: {
      gap: 2,
      mt: 2,
      alignItems: "flex-start",
      justifyContent: "normal",
      "& > svg": {
        color: "common.main",
        minWidth: 0,
        width: "40px"
      },
      ".MuiTypography-root": {
        color: "common.main"
      },
      ".MuiIconButton-root svg": {}
    },
    divider: { my: 3 }
  };
  return (
    <WidgetContainer
      sx={{
        width
      }}
    >
      <Stack sx={{ gap: 2, flexWrap: "wrap" }} alignItems="flex-start">
        <Stack sx={{ gap: 2, maxWidth: "88%" }} alignItems="flex-start">
          <Avatar
            src={previewUser.photoUrl}
            alt={`${previewUser.username} avatar`}
          />
          <Box
            sx={{
              minWidth: 0,
              color: "common.medium",
              wordBreak: "break-word"
            }}
          >
            <StyledTypography
              component="p"
              variant="h5"
              fontWeight="bold"
              color="common.dark"
            >
              {previewUser.displayName}
            </StyledTypography>
            <Typography
              color="inherit"
              component={StyledLink}
              to={userLink}
              variant="caption"
            >
              @{previewUser.username}
            </Typography>
            <div style={{ whiteSpace: "nowrap" }}>
              <StyledLink
                sx={{ color: "inherit" }}
                to={`${userLink}#following`}
              >
                {previewUser.following.length} following
              </StyledLink>
              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                sx={{ color: "inherit" }}
                to={`${userLink}#followers`}
              >
                {previewUser.followers.length} followers
              </StyledLink>
            </div>
          </Box>
        </Stack>
        <IconButton component={StyledLink} to={userLink}>
          <ManageAccountsOutlined />
        </IconButton>
      </Stack>
      {previewUser.bio ? (
        <Typography
          variant="caption"
          component="p"
          color="common.dark"
          fontWeight="500"
          sx={{ mt: "1rem", pl: "0px" }}
        >
          {previewUser.bio}
        </Typography>
      ) : null}
      {previewUser.occupation || previewUser.location ? (
        <>
          <Divider sx={styles.divider} />
          <Box>
            {previewUser.location ? (
              <Stack sx={styles.textValue}>
                <LocationOnOutlinedIcon />
                <Typography>{previewUser.location}</Typography>
              </Stack>
            ) : null}
            {previewUser.occupation ? (
              <Stack sx={styles.textValue}>
                <WorkOutlinedIcon />
                <Typography>{previewUser.occupation}</Typography>
              </Stack>
            ) : null}
          </Box>
        </>
      ) : null}

      {previewUser.socials ? (
        <>
          <Divider sx={styles.divider} />
          <Box>
            <Typography
              variant="h5"
              color="common.main"
              fontWeight="500"
              mb="1rem"
            >
              Social Profiles
            </Typography>
            {Object.keys(previewUser.socials).map((l, i) => {
              const url = previewUser.socials[l];
              return (
                <Stack sx={styles.textValue} key={i}>
                  {
                    {
                      twitter: <TwitterIcon />,
                      linkedIn: <LinkedInIcon />
                    }[l]
                  }
                  <div style={{ minWidth: "100px", flex: 1 }}>
                    <Typography
                      component="a"
                      href={url}
                      target="_blank"
                      // noOpener
                      // noReffer
                      fontWeight="500"
                      sx={{
                        color: "common.main",
                        "&:hover": {
                          textDecoration: "underline"
                        }
                      }}
                    >
                      {url}
                    </Typography>
                    <Typography>
                      {
                        {
                          twitter: "Social Network",
                          linkedIn: "Network platform"
                        }[l]
                      }
                    </Typography>
                  </div>
                  <IconButton
                    component={StyledLink}
                    to={`${userLink}#user-${l}`}
                  >
                    <EditOutlined />
                  </IconButton>
                </Stack>
              );
            })}
          </Box>
        </>
      ) : null}
    </WidgetContainer>
  );
};

UserWidget.propTypes = {};

export default UserWidget;
