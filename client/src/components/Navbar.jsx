import React, { useState } from "react";
import {
  Stack,
  Typography,
  InputBase,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from "@mui/material";
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
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import useMediaQuery from "@mui/material/useMediaQuery";

const Navbar = () => {
  const {
    palette: { mode }
  } = useTheme();
  //   const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [searchParam, setSearchParam] = useSearchParams();
  const isBls320 = useMediaQuery("(max-width: 319px)");
  const fullName = `Marvellous akinrinmola`; //`${user.firstName} ${user.lastName}`;
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
  const selectElem = (
    <FormControl variant="standard" value={fullName} sx={{ width: "100%" }}>
      <Select
        value={fullName}
        sx={{
          backgroundColor: "common.light",
          width: "80%",
          marginInline: "auto",
          borderRadius: "0.25rem",
          p: "0.25rem 1rem",
          "& .MuiSvgIcon-root": {
            pr: "0.25rem",
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
        onChange={(...props) => console.log(props)}
        input={<InputBase />}
      >
        <MenuItem value={fullName}>
          <Typography>{fullName}</Typography>
        </MenuItem>
        <MenuItem component={Link} to="/auth/signin">
          Log Out
        </MenuItem>
      </Select>
    </FormControl>
  );

  const searchElem = (
    <Stack
      sx={{
        backgroundColor: "common.light",
        borderRadius: "8px",
        justifyContent: "normal",
        width: "80%",
        mx: "auto",
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
          py: 2,
          width: "100%"
        }}
      >
        <Stack
          gap={3}
          sx={{
            "&:focus-within": {
              xs: {
                a: {
                  width: 30
                }
              },
              md: {
                a: {
                  width: "auto"
                }
              }
            }
          }}
        >
          <Link
            style={{
              display: isBls320 ? "none" : "inline-flex"
            }}
          >
            <Typography
              sx={{
                color: "primary.main",
                fontSize: "clamp(0.5rem,1.2rem,2.25rem)",
                fontWeight: "bold",
                marginBottom: 0,
                textOverflow: "ellipsis",
                overflow: "hidden",
                "&:hover": {
                  color: "primary.light",
                  cursor: "pointer"
                }
              }}
            >
              Mernsocial
            </Typography>
          </Link>
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
          <IconButton>
            <MessageIcon />
          </IconButton>
          <IconButton>
            <NotificationsIcon />
          </IconButton>
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
              title: "Chat",
              icon: MessageIcon
            },
            {
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
          ].map(l => (
            <ListItemButton key={l.title} component="li" onClick={l.onClick}>
              <ListItemIcon>
                <l.icon />
              </ListItemIcon>
              <ListItemText
                primary={l.title}
                sx={{ textTransform: "capitalize" }}
              />
            </ListItemButton>
          ))}
        </List>
        {selectElem}
        {searchElem}
      </SwipeableDrawer>
    </>
  );
};

export default Navbar;
