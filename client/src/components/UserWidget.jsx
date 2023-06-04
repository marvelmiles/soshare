import React, { useEffect, useState, useRef } from "react";
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
import { useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "context/slices/userSlice";

const UserWidget = ({ width, user }) => {
  const { socket } = useContext();
  const [searchParams] = useSearchParams();
  const { previewUser, currentUser } = useSelector(({ user }) => user);

  const [cUser, setCUser] = useState(
    user ||
      currentUser || {
        following: [],
        followers: [],
        recommendationBlacklist: [],
        socials: {}
      }
  );
  const dispatch = useDispatch();
  const stateRef = useRef({
    isCurrentUser: user?.id ? user.id === currentUser?.id : true,
    withSocket: !user,
    cid: cUser.id
  });

  useEffect(() => {
    const ctx = stateRef.current;
    const handleUserUpdate = u => {
      if (u.id === stateRef.current.cid) {
        dispatch(updateUser(u));
        dispatch(updatePreviewUser({ nullify: true }));
      }
    };
    ctx.withSocket &&
      ctx.isCurrentUser &&
      socket.on("update-user", handleUserUpdate);
    return () => {
      socket.removeEventListener("update-user", handleUserUpdate);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    stateRef.current.isCurrentUser &&
      setCUser(u => ({
        ...u,
        ...currentUser
      }));
  }, [currentUser]);

  useEffect(() => {
    stateRef.current.isCurrentUser &&
      setCUser(u => ({
        ...u,
        ...previewUser
      }));
  }, [previewUser]);

  useEffect(() => {
    setCUser(u => ({
      ...u,
      ...user
    }));
  }, [user]);

  const userLink = `/u/${cUser.id}`;

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
            src={cUser.photoUrl}
            alt={`${cUser.username} avatar`}
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
              {cUser.displayName}
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
              @{cUser.username}
            </Typography>
            <div style={{ whiteSpace: "wrap" }}>
              <StyledLink
                sx={{ color: "inherit" }}
                to={renderSV("user-following")}
              >
                {cUser.following.length} following
              </StyledLink>
              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                sx={{ color: "inherit" }}
                to={renderSV("user-followers")}
              >
                {cUser.followers.length} followers
              </StyledLink>

              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink sx={{ color: "inherit" }} to={renderSV("user-posts")}>
                {cUser.postCount} posts
              </StyledLink>

              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                sx={{ color: "inherit" }}
                to={renderSV("user-shorts")}
              >
                {cUser.shortCount} shorts
              </StyledLink>
              {stateRef.current.isCurrentUser ? (
                <>
                  <span style={{ marginInline: "2px" }}>|</span>
                  <StyledLink
                    sx={{ color: "inherit" }}
                    to={renderSV("user-blacklist")}
                  >
                    {cUser.blacklistCount} blacklist
                  </StyledLink>
                </>
              ) : null}
            </div>
          </Box>
        </Stack>
        {stateRef.current.isCurrentUser ? (
          <IconButton component={StyledLink} to={userLink}>
            <ManageAccountsOutlined />
          </IconButton>
        ) : null}
      </Stack>
      {cUser.bio ? (
        <Typography
          variant="caption"
          component="p"
          color="grey.800"
          fontWeight="500"
          sx={{ mt: "1rem", pl: "0px" }}
        >
          {cUser.bio}
        </Typography>
      ) : null}
      {cUser.occupation || cUser.location ? (
        <>
          <Divider sx={styles.divider} />
          <Box>
            {cUser.location ? (
              <Stack sx={styles.textValue}>
                <LocationOnOutlinedIcon />
                <Typography>{cUser.location}</Typography>
              </Stack>
            ) : null}
            {cUser.occupation ? (
              <Stack sx={styles.textValue}>
                <WorkOutlinedIcon />
                <Typography>{cUser.occupation}</Typography>
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
              {cUser.email}
            </Typography>
            <Typography>Mail Service</Typography>
          </div>
        </Stack>
        {Object.keys(cUser.socials).map((l, i) => {
          const url = cUser.socials[l];
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
