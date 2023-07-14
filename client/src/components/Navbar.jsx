import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Stack,
  Typography,
  InputBase,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover
} from "@mui/material";
import { useSelector } from "react-redux";
import {
  useNavigate,
  Link,
  useSearchParams,
  useParams
} from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@mui/material";
import { useDispatch } from "react-redux";
import { toggleThemeMode } from "context/slices/configSlice";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MessageIcon from "@mui/icons-material/Message";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddToQueueIcon from "@mui/icons-material/AddToQueue";
import PersonIcon from "@mui/icons-material/Person";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { StyledLink, StyledMenuItem, StyledBadge } from "components/styled";
import { useContext } from "context/store";
import http, { createRelativeURL } from "api/http";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import Notifications from "components/Notifications";
import BrandIcon from "components/BrandIcon";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { mapValidItems } from "utils";
import Box from "@mui/material/Box";
import UserSettings from "components/UserSettings";
import { useMediaQuery } from "@mui/material";
import { signoutUser } from "context/slices/userSlice";

Popover.defaultProps = {
  open: false,
  anchorEl: null
};

const Navbar = ({ routePage = "homePage" }) => {
  const {
    palette: { mode }
  } = useTheme();
  const { socket, setSnackBar, prevPath } = useContext();
  const currentUser = useSelector(state => state.user.currentUser || {});
  const stateRef = useRef({
    notifications: {
      marked: {},
      unmarked: {}
    }
  });
  const dispatch = useDispatch();
  const [openDrawer, setOpenDrawer] = useState(false);
  const isMd = useMediaQuery("(min-width:768px)");
  const [popover, setPopover] = useState({});
  const [query, setQuery] = useState("");
  const [unseens, setUnseens] = useState({
    notifications: 0
  });
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [openUserSelect, setOpenUserSelect] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        if (currentUser.id)
          setUnseens(
            (await http.get("/users/unseen-alerts?excludeUser=true", {
              withCredentials: true
            })) || {}
          );
      } catch (_) {}
    })();
  }, [setSnackBar, currentUser.id]);

  useEffect(() => {
    if (socket) {
      const handleAppendNotification = (n, { filter, isNew }) => {
        if (isNew && !filter && n.to.id === currentUser.id) {
          let count = 0;
          setUnseens(unseens => {
            if (count) {
              unseens.notifications = count;
              return unseens;
            }
            count = unseens.notifications + 1;
            return {
              ...unseens,
              notifications: count
            };
          });
          if (popover.openFor !== "notifications")
            stateRef.current.notifications.unmarked = {
              data: [n].concat(
                stateRef.current.notifications.unmarked.data || []
              )
            };
        }
      };

      const handleDeleteNotifications = notices => {
        let notified = false;
        setUnseens(unseens => {
          if (notified) {
            notified = false;
            return unseens;
          }
          notified = true;
          return {
            ...unseens,
            notifications:
              unseens.notifications > notices.length
                ? unseens.notifications - notices.length
                : 0
          };
        });
      };

      if (currentUser.id) {
        socket.on("notification", handleAppendNotification);
        socket.on("filter-notifications", handleDeleteNotifications);
      }

      return () => {
        socket.removeEventListener("notification", handleAppendNotification);
        socket.removeEventListener(
          "filter-notifications",
          handleDeleteNotifications
        );
      };
    }
  }, [socket, currentUser.id, popover.openFor]);

  useEffect(() => {
    setOpenUserSelect(false);
    setOpenDrawer(false);
    setPopover(prev => ({ ...prev, open: false }));
  }, [isMd]);

  const toggleTheme = useCallback(() => {
    dispatch(toggleThemeMode());
  }, [dispatch]);
  const handleDrawer = open => e => {
    if (e && e.type === "keydown" && (e.key === "Tab" || e.key === "Shift"))
      return;
    setOpenDrawer(open);
  };

  const closePopover = e => {
    if (e?.stopPropagation) e.stopPropagation();
    setPopover({
      ...popover,
      open: false
    });
    setTimeout(() => {
      setPopover({});
    }, 5000);
  };

  const handleSearch = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/search?q=${query}&tab=${searchParams.get("tab") || "posts"}`);
    },
    [searchParams, navigate, query]
  );

  const markNotification = async (
    index,
    { setData, data },
    { handleState, cacheType, e, to }
  ) => {
    let filter = [];
    try {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setUnseens(unseens => ({
        ...unseens,
        notifications: unseens.notifications
          ? unseens.notifications - (index === -1 ? data.length : 1)
          : 0
      }));
      const __data =
        index === -1
          ? (filter = data.data) && []
          : data.data.filter((d, i) => {
              if (index === i) {
                filter.push(d);
                return false;
              }
              return true;
            });
      if (cacheType)
        stateRef.current.notifications[cacheType] = {
          data: filter
        };

      setData({
        ...data,
        data: __data
      });
      handleState();
      to && navigate(to);
      await http.patch(`/users/notifications/mark`, filter.map(({ id }) => id));
    } catch (err) {
      const validList = mapValidItems(err, filter);
      if (validList.length)
        if (cacheType) stateRef.current.notifications[cacheType].filter = true;
      setData({
        ...data,
        data: validList
      });
      setUnseens({
        ...unseens,
        notifications: unseens.notifications + validList.length
      });
      handleState(undefined, { disabled: false });
      setSnackBar(
        `Failed to mark ${
          validList.length > 1
            ? `${validList.length} notifications`
            : `notification`
        }!`
      );
    }
  };

  const closeUserSelect = e => {
    e.stopPropagation();
    setOpenUserSelect(false);
    handleDrawer(false)();
  };

  const handleOpenUserSelect = e => {
    e.stopPropagation();
    setOpenUserSelect(true);
  };

  const handleSignOut = () => {
    dispatch(signoutUser());
    setOpenDrawer(false);
    navigate("/");
  };

  const signinPath = `/auth/signin?redirect=${encodeURIComponent(
    createRelativeURL()
  )}`;

  const createProfileParam = (value, key = "view") =>
    `/u/${userId || currentUser.id}?${key}=${value}${
      userId === currentUser.id ? "" : `&wc=true`
    }`;

  const selectElem = currentUser.id ? (
    <FormControl
      variant="outlined"
      sx={{
        width: "100%",
        minWidth: "180px",
        px: 2
      }}
    >
      <Select
        onClose={closeUserSelect}
        open={openUserSelect}
        defaultValue={`@${currentUser.username}`}
        value={`@${currentUser.username}`}
        sx={{
          backgroundColor: "background.alt",
          width: "100%",
          marginInline: "auto",
          borderRadius: "0.25rem",
          p: "0.25rem 1rem",
          gap: 2,
          border: "1px solid currentColor",
          borderColor: "divider",
          "& .MuiSvgIcon-root": {
            fontSize: "32px"
          },
          "& .MuiTypography-root": {
            overflow: "hidden",
            textOverflow: "ellipsis"
          },
          "& .MuiSelect-select:focus": {
            backgroundColor: "common.light"
          }
        }}
        input={<InputBase />}
        renderValue={() => `@${currentUser.username}`}
        onClick={handleOpenUserSelect}
      >
        <StyledMenuItem
          key={currentUser.username}
          value={`@${currentUser.username}`}
          sx={{
            p: 0,
            m: 0,
            height: 0,
            minHeight: 0,
            opacity: 0,
            pointerEvents: "none"
          }}
        />
        {{
          profilePage: [
            {
              to: `/u/${currentUser.id}`,
              label: "Me",
              icon: PersonIcon,
              nullify: currentUser.id === userId
            },
            {
              to: createProfileParam("create-post", "compose"),
              label: "Create Post",
              icon: AddIcon
            },
            {
              to: createProfileParam("create-short", "compose"),
              label: "Create Short",
              icon: AddToQueueIcon
            },
            {
              to: createProfileParam("user-posts"),
              label: "My Posts",
              icon: ListAltIcon
            },
            {
              to: createProfileParam("user-shorts"),
              label: "My Shorts",
              icon: VideoLibraryIcon
            }
          ],
          homePage: [
            {
              to: `/u/${currentUser.id}`,
              label: "Me",
              icon: PersonIcon
            }
          ]
        }[routePage].map((l, i) =>
          l.nullify
            ? null
            : l.label && (
                <StyledMenuItem
                  key={i}
                  value={l.label}
                  to={l.to}
                  component={StyledLink}
                  onClick={closeUserSelect}
                  sx={{
                    borderBottom: "1px solid currentColor",
                    borderColor: "divider",
                    py: "16px",
                    mt: 0
                  }}
                >
                  <l.icon />
                  <Typography>{l.label}</Typography>
                </StyledMenuItem>
              )
        )}
        <StyledMenuItem
          sx={{
            borderBottom: "1px solid currentColor",
            borderColor: "divider",
            py: "16px"
          }}
          onClick={closePopover}
          component={StyledLink}
          to="/shorts"
        >
          <SlideshowIcon />
          <Typography>Shorts</Typography>
        </StyledMenuItem>
        <StyledMenuItem
          sx={{
            py: "16px"
          }}
          onClick={handleSignOut}
        >
          <LogoutIcon />
          <Typography>Signout</Typography>
        </StyledMenuItem>
      </Select>
    </FormControl>
  ) : (
    <IconButton
      component={Link}
      to={signinPath}
      sx={{
        display: {
          xs: "none",
          md: "inline-flex"
        }
      }}
    >
      <LoginIcon />
    </IconButton>
  );

  const searchElem = (
    <Box sx={{ px: 2, flex: 1 }}>
      <Stack
        gap={0}
        sx={{
          border: "1px solid #333",
          borderColor: "divider",
          borderRadius: "8px",
          width: "100%",
          div: {
            borderRadius: 0,
            padding: 0,
            paddingLeft: 1,
            margin: 0,
            border: 0
          },
          button: {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0
          }
        }}
        component="form"
        onSubmit={handleSearch}
      >
        <InputBase
          placeholder="Search..."
          value={query}
          onChange={({ currentTarget }) => setQuery(currentTarget.value)}
        />
        <IconButton type="submit">
          <SearchIcon />
        </IconButton>
      </Stack>
    </Box>
  );

  const renderPopover = () => {
    switch (popover.openFor) {
      case "notifications":
        const type = unseens.notifications < 1 ? "marked" : "unmarked";
        return (
          <Notifications
            defaultType={type}
            markNotification={markNotification}
            cache={stateRef.current.notifications}
            dataSx={{
              minHeight: "300px",
              maxHeight: "300px",
              overflowY: "auto"
            }}
            sx={{
              minHeight: "366px"
            }}
          />
        );
      case "userSettings":
        return <UserSettings />;
      default:
        return null;
    }
  };

  const showPopover = async ({ currentTarget }, openFor) => {
    setPopover({
      openFor,
      open: true,
      anchorEl: currentTarget
    });
  };

  const showUserSettings = e => showPopover(e, "userSettings");

  const showNotifications = e => showPopover(e, "notifications");

  const handleGoBack = e => {
    e.stopPropagation();
    navigate(-1, { state: null, replace: true });
  };

  return (
    <>
      <Stack
        sx={{
          backgroundColor: "background.default",
          px: 1,
          width: "100%",
          position: "fixed",
          top: 0,
          zIndex: "appBar",
          height: "64px",
          borderBottom: "1px solid #fff",
          borderColor: "divider"
        }}
      >
        <Stack
          gap={{
            xs: 0,
            md: 1
          }}
        >
          {prevPath ? (
            <IconButton title="Go back" onClick={handleGoBack}>
              <KeyboardBackspaceIcon />
            </IconButton>
          ) : null}
          <BrandIcon
            sx={{
              display: {
                xs: "none",
                md: "flex"
              }
            }}
          />
          {searchElem}
        </Stack>

        <Stack
          sx={{
            display: {
              xs: "none",
              md: "flex"
            }
          }}
        >
          <IconButton onClick={toggleTheme}>
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <IconButton component={StyledLink} to="/shorts">
            <SlideshowIcon />
          </IconButton>
          {currentUser.id ? (
            <>
              <IconButton onClick={showNotifications}>
                <StyledBadge
                  badgeContent={unseens.notifications || 0}
                  max={999}
                  sx={{
                    ".MuiBadge-badge": {
                      color: "common.white"
                    }
                  }}
                  color="primary"
                >
                  <NotificationsIcon />
                </StyledBadge>
              </IconButton>
              <IconButton>
                <StyledBadge
                  sx={{
                    ".MuiBadge-badge": {
                      color: "common.white"
                    }
                  }}
                  color="primary"
                  badgeContent={1000}
                  max={999}
                >
                  <MessageIcon />
                </StyledBadge>
              </IconButton>

              <IconButton onClick={showUserSettings}>
                <ManageAccountsIcon />
              </IconButton>
            </>
          ) : null}
          {!openDrawer && selectElem}
        </Stack>

        <Stack
          onClick={handleDrawer(true)}
          sx={{
            display: {
              xs: "flex",
              md: "none"
            }
          }}
        >
          <IconButton>
            <MenuIcon />
          </IconButton>
        </Stack>
      </Stack>

      <SwipeableDrawer
        anchor="left"
        open={openDrawer}
        onClose={handleDrawer(false)}
        onOpen={handleDrawer(true)}
        PaperProps={{
          sx: {
            backgroundImage: "none",
            overflow: "auto",
            position: "relative"
          }
        }}
      >
        <Stack
          sx={{
            position: "sticky",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: "appBar",
            backgroundColor: "background.paper"
          }}
          p={2}
        >
          <BrandIcon />
          <IconButton onClick={handleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <List
          component="nav"
          sx={{
            width: "100%",
            "& ~ div": {
              mt: 3
            }
          }}
        >
          {[
            {
              nullify: !currentUser.id,
              title: "Notification",

              icon: NotificationsIcon,
              onClick: showNotifications,
              badgeContent: unseens.notifications
            },
            {
              nullify: !currentUser.id,
              title: "Chat",
              icon: MessageIcon
            },
            {
              nullify: !currentUser.id,
              title: "Settings",
              icon: ManageAccountsIcon,
              onClick: showUserSettings
            },
            {
              title: mode + " mode",
              icon: DarkModeIcon,
              onClick: toggleTheme
            },
            {
              title: "Shorts",
              icon: SlideshowIcon,
              to: "/shorts"
            },
            {
              title: currentUser.id ? "Signout" : "Signin",
              icon: currentUser.id ? LogoutIcon : LoginIcon,
              onClick: currentUser.id
                ? handleSignOut
                : () => {
                    navigate(signinPath);
                  }
            }
          ].map((l, i) =>
            l.nullify ? null : (
              <ListItemButton
                key={i}
                component={l.to ? Link : "li"}
                to={l.to}
                onClick={l.to ? () => setOpenDrawer(false) : l.onClick}
              >
                <ListItemIcon>
                  <StyledBadge
                    badgeContent={l.badgeContent || 0}
                    color="primary"
                    max={999}
                    sx={{
                      ".MuiBadge-badge": {
                        right: 2,
                        top: 8,
                        color: "common.white"
                      }
                    }}
                    color="primary"
                  >
                    <IconButton
                      sx={{
                        backgroundColor: ({ palette: { mode } }) =>
                          mode === "dark" && "action.selected"
                      }}
                    >
                      <l.icon />
                    </IconButton>
                  </StyledBadge>
                </ListItemIcon>
                <ListItemText
                  primary={l.title}
                  sx={{ textTransform: "capitalize" }}
                />
              </ListItemButton>
            )
          )}
        </List>
        {openDrawer && selectElem}
        {searchElem}
      </SwipeableDrawer>
      {currentUser.id ? (
        <Popover
          open={popover.open}
          anchorEl={popover.anchorEl}
          PaperProps={{
            sx: {
              width: "100%",
              maxWidth: 420
            }
          }}
          onClose={closePopover}
        >
          {renderPopover()}
        </Popover>
      ) : null}
    </>
  );
};

export default Navbar;
