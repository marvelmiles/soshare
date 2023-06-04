import React, { useState, useEffect } from "react";
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
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useContext } from "context/store";

const UserWidget = ({ width, user }) => {
  const [user, setUser] = useState(
    useSelector(state => state.user.currentUser)
  );
  const [searchParams] = useSearchParams();
  const { socket } = useContext();
  const user = useSelector(({ user: { user, currentUser } }) => {
    const isCurrentUser =
      user.id && currentUser ? user.id === currentUser.id : true;
    return isCurrentUser
      ? {
          ...currentUser,
          ...user,
          ...user,
          isCurrentUser
        }
      : {
          following: [],
          followers: [],
          recommendationBlacklist: [],
          socials: {},
          ...user,
          isCurrentUser
        };
  });

  useEffect(() => {
    socket.on("update-user", u => (u.id === user.id ? setUser(u) : undefined));
  }, [socket, user.id]);

  const userLink = `/u/${user.id}`;

  const styles = {
    textValue: {
      gap: 2,
      mt: 2,
      alignItems: "flex-start",
      justifyContent: "normal",
      "& > svg": {
        color: "text.secondary",
        minWidth: 0,
        width: "40px"
      },
      ".MuiTypography-root": {
        color: "text.secondary"
      }
    },
    divider: { my: 3 }
  };
  const renderSV = v => {
    const view = (searchParams.get("view") || "").toLowerCase();
    return `${
      window.location.search
        ? view
          ? window.location.search.replace(`view=${view}`, `view=${v}`)
          : window.location.search + `&view=${v}`
        : `?view=${v}`
    }`;
  };
  return (
    <WidgetContainer
      sx={{
        width
      }}
      className="widget-container"
    >
      <Stack sx={{ gap: 2, flexWrap: "wrap" }} alignItems="flex-start">
        <Stack
          sx={{
            gap: 2,
            flexWrap: {
              xs: "wrap",
              s320: "nowrap"
            },
            width: {
              xs: "100%",
              s320: "calc(100% - 50px)"
            }
          }}
          alignItems="flex-start"
          justifyContent="normal"
        >
          <Avatar
            src={user.photoUrl}
            alt={`${user.username} avatar`}
            variant="sm"
          />
          <Box
            sx={{
              minWidth: 0,
              color: "text.secondary",
              wordBreak: "break-word"
            }}
          >
            <StyledTypography
              component="p"
              variant="h5"
              fontWeight="bold"
              color="text.primary"
              sx={{
                wordBreak: "break-word"
              }}
            >
              {user.displayName}
            </StyledTypography>
            <Typography
              color="inherit"
              component={StyledLink}
              to={userLink}
              variant="caption"
              sx={{
                wordBreak: "break-word"
              }}
            >
              @{user.username}
            </Typography>
            <div style={{ whiteSpace: "wrap" }}>
              <StyledLink
                sx={{ color: "inherit" }}
                to={renderSV("user-following")}
              >
                {user.following.length} following
              </StyledLink>
              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                sx={{ color: "inherit" }}
                to={renderSV("user-followers")}
              >
                {user.followers.length} followers
              </StyledLink>

              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink sx={{ color: "inherit" }} to={renderSV("user-posts")}>
                {user.postsCount} posts
              </StyledLink>

              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                sx={{ color: "inherit" }}
                to={renderSV("user-shorts")}
              >
                {user.shortsCount} shorts
              </StyledLink>
              {user.isCurrentUser ? (
                <>
                  <span style={{ marginInline: "2px" }}>|</span>
                  <StyledLink
                    sx={{ color: "inherit" }}
                    to={renderSV("user-blacklist")}
                  >
                    {user.recommendationBlacklist.length} blacklist
                  </StyledLink>
                </>
              ) : null}
            </div>
          </Box>
        </Stack>
        <IconButton component={StyledLink} to={userLink}>
          <ManageAccountsOutlined />
        </IconButton>
      </Stack>
      {user.bio ? (
        <Typography
          variant="caption"
          component="p"
          color="grey.800"
          fontWeight="500"
          sx={{ mt: "1rem", pl: "0px" }}
        >
          {user.bio}
        </Typography>
      ) : null}
      {user.occupation || user.location ? (
        <>
          <Divider sx={styles.divider} />
          <Box>
            {user.location ? (
              <Stack sx={styles.textValue}>
                <LocationOnOutlinedIcon />
                <Typography>{user.location}</Typography>
              </Stack>
            ) : null}
            {user.occupation ? (
              <Stack sx={styles.textValue}>
                <WorkOutlinedIcon />
                <Typography>{user.occupation}</Typography>
              </Stack>
            ) : null}
          </Box>
        </>
      ) : null}
      <Divider sx={styles.divider} />
      <Box>
        <Typography
          variant="h5"
          color="text.secondary"
          fontWeight="500"
          mb="1rem"
        >
          Social Profiles
        </Typography>
        <Stack sx={styles.textValue}>
          <MailOutlineIcon />
          <div style={{ minWidth: "100px", flex: 1 }}>
            <Typography
              fontWeight="500"
              sx={{
                color: "text.secondary"
              }}
            >
              {user.email}
            </Typography>
            <Typography>Mail Service</Typography>
          </div>
        </Stack>
        {Object.keys(user.socials).map((l, i) => {
          const url = user.socials[l];
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
                  referrerPolicy="no-referrer"
                  rel="noopener"
                  fontWeight="500"
                  sx={{
                    color: "text.secondary",
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
            </Stack>
          );
        })}
      </Box>
    </WidgetContainer>
  );
};

UserWidget.propTypes = {};

export default UserWidget;
