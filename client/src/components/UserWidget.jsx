import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import { Box, Stack, Divider, IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import ManageAccountsOutlined from "@mui/icons-material/ManageAccountsOutlined";
import { StyledLink } from "components/styled";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WorkOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { useSelector } from "react-redux";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useContext } from "context/store";
import { useDispatch } from "react-redux";
import { updateUser, updatePreviewUser } from "context/slices/userSlice";
import UserTip from "tooltips/UserTip";

const UserWidget = ({ width, user }) => {
  const { socket } = useContext();
  const { previewUser, currentUser } = useSelector(({ user }) => user);

  const [cUser, setCUser] = useState(user || currentUser);
  const dispatch = useDispatch();
  const stateRef = useRef({
    withSocket: !user,
    cid: cUser.id
  });

  const isCurrentUser = user?.id ? user.id === currentUser.id : true;

  useEffect(() => {
    if (socket) {
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
    }
  }, [socket, dispatch]);

  useEffect(() => {
    isCurrentUser &&
      setCUser(u => ({
        ...u,
        ...currentUser
      }));
  }, [currentUser, isCurrentUser]);

  useEffect(() => {
    isCurrentUser &&
      setCUser(u => ({
        ...u,
        ...previewUser
      }));
  }, [previewUser, isCurrentUser]);

  useEffect(() => {
    setCUser(u => ({
      ...u,
      ...user
    }));
  }, [user]);

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
  return (
    <WidgetContainer
      sx={{
        width
      }}
      className="widget-container"
    >
      <UserTip
        disableSnippet
        actionBar={
          isCurrentUser && !user ? (
            <IconButton component={StyledLink} to={`/u/${cUser.id}`}>
              <ManageAccountsOutlined />
            </IconButton>
          ) : null
        }
        user={cUser}
        isOwner={isCurrentUser}
      />
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
          <div title={"Email"}>
            <MailOutlineIcon sx={{ cursor: "default" }} />
          </div>
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
                  twitter: (
                    <div title={l}>
                      <TwitterIcon sx={{ cursor: "default" }} />
                    </div>
                  ),
                  linkedIn: (
                    <div title={l}>
                      <LinkedInIcon sx={{ cursor: "default" }} />
                    </div>
                  )
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
