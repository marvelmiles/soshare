import React, { useState } from "react";
import {
  Stack,
  Typography,
  InputBase,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Divider
} from "@mui/material";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@mui/material";
import { useDispatch } from "react-redux";
import { toggleThemeMode } from "../redux/configSlice";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MessageIcon from "@mui/icons-material/Message";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HelpIcon from "@mui/icons-material/Help";
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

import { StyledLink, StyledMenuItem } from "./styled";

const Navbar = ({ routePage = "homePage" }) => {
  const {
    palette: { mode }
  } = useTheme();
  const { currentUser } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [searchParam, setSearchParam] = useSearchParams();

  const query = searchParam.get("q") || "";
  const toggleTheme = () => {
    dispatch(toggleThemeMode());
  };
  const handleDrawer = open => e => {
    if (e && e.type === "keydown" && (e.key === "Tab" || e.key === "Shift"))
      return;
    setOpenDrawer(open);
  };
  const handleSearch = () => {
    setSearchParam({
      q: ""
    });
  };
  const selectElem = currentUser ? (
    <FormControl variant="standard" sx={{ width: "100%" }}>
      <Select
        defaultValue={currentUser.displayName || currentUser.username}
        value={currentUser.displayName || currentUser.username}
        sx={{
          backgroundColor: "common.light",
          width: "80%",
          marginInline: "auto",
          borderRadius: "0.25rem",
          p: "0.25rem 1rem",
          gap: 2,
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
        renderValue={() => currentUser.displayName || currentUser.username}
      >
        <StyledMenuItem
          value={currentUser.displayName || currentUser.username}
          sx={{ opacity: 0, pointerEvents: "none", m: 0, p: 0 }}
        />
        <StyledMenuItem value="Profile" to="/u/1234">
          <PersonIcon />
          <Typography>Profile</Typography>
        </StyledMenuItem>
        {{
          profilePage: [
            { to: "?d=create-post", label: "Create Post", icon: AddIcon },
            {
              to: "?d=create-shorts",
              label: "Create Short",
              icon: AddToQueueIcon
            },
            "",
            {
              to: "?d=user-posts",
              label: "My Posts",
              icon: ListAltIcon
            },
            {
              to: "?d=user-shorts",
              label: "My Shorts",
              icon: SlideshowIcon
            },
            ""
          ],
          homePage: [
            {
              to: "?d=shorts",
              label: "Shorts",
              icon: SlideshowIcon
            }
          ]
        }[routePage].map((l, i) =>
          l.label ? (
            <StyledMenuItem
              key={i}
              value={l.label}
              to={l.to}
              component={StyledLink}
            >
              <l.icon />
              <Typography>{l.label}</Typography>
            </StyledMenuItem>
          ) : (
            <Divider key={i + Date.now()} />
          )
        )}
        <StyledMenuItem to="/auth/signin">
          <LoginIcon />
          <Typography> Log Out</Typography>
        </StyledMenuItem>
      </Select>
    </FormControl>
  ) : null;

  const searchElem = (
    <Stack
      gap={0}
      sx={{
        border: "1px solid #333",
        borderColor: "divider",
        borderRadius: "8px",
        width: "80%",
        mx: "auto",
        div: {
          borderRadius: 0,
          padding: 0,
          paddingLeft: 1,
          margin: 0,
          border: 0
        },
        button: {
          borderTopRightRadius: "inherit",
          borderBottomRightRadius: "inherit"
        }
      }}
    >
      <InputBase
        placeholder="Search..."
        value={query}
        onChange={({ currentTarget }) =>
          setSearchParam({
            q: currentTarget.value
          })
        }
      />
      <IconButton onClick={handleSearch}>
        <SearchIcon />
      </IconButton>
    </Stack>
  );

  return (
    <>
      <Stack
        sx={{
          backgroundColor: "background.alt",
          px: 1,
          width: "100%",
          position: "sticky",
          top: 0,
          zIndex: "appBar",
          minHeight: "64px"
        }}
      >
        <Stack gap={3}>
          <StyledLink
            variant="h5"
            sx={{
              fontWeight: "bold",
              display: {
                xs: "none",
                s320: "inline-flex"
              }
            }}
          >
            Mernsocial
          </StyledLink>
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
          {currentUser ? (
            <>
              <IconButton>
                <MessageIcon />
              </IconButton>
              <IconButton>
                <NotificationsIcon />
              </IconButton>
            </>
          ) : null}
          <IconButton>
            <HelpIcon />
          </IconButton>

          {selectElem}
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
      >
        <Stack justifyContent="flex-end" p={2}>
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
              nullify: !currentUser,
              title: "Chat",
              icon: MessageIcon
            },
            {
              nullify: !currentUser,
              title: "Notification",
              icon: NotificationsIcon
            },
            {
              title: "Question",
              icon: HelpIcon
            },
            {
              title: mode + " mode",
              icon: DarkModeIcon,
              onClick: toggleTheme
            }
          ].map((l, i) =>
            l.nullify ? null : (
              <ListItemButton key={i} component="li" onClick={l.onClick}>
                <ListItemIcon>
                  <l.icon />
                </ListItemIcon>
                <ListItemText
                  primary={l.title}
                  sx={{ textTransform: "capitalize" }}
                />
              </ListItemButton>
            )
          )}
        </List>
        {selectElem}
        {searchElem}
      </SwipeableDrawer>
    </>
  );
};

export default Navbar;
