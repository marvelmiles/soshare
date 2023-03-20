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
  ListItemSecondaryAction,
  Popover,
  Divider,
  Checkbox,
  ButtonGroup,
  Button
} from "@mui/material";
import { useSelector } from "react-redux";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { StyledLink, StyledMenuItem, StyledBadge } from "./styled";
import { useContext } from "redux/store";
import http from "api/http";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CircleIcon from "@mui/icons-material/Circle";
import { getScrollAtIndexes } from "utils";
import MarkEmailUnreadSharpIcon from "@mui/icons-material/MarkEmailUnreadSharp";
import { StyledTypography } from "components/styled";
import InfiniteScroll from "./InfiniteScroll";
import moment from "moment";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/Delete";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";

Popover.defaultProps = {
  open: false,
  anchorEl: null
};

const Navbar = ({ routePage = "homePage" }) => {
  const {
    palette: { mode }
  } = useTheme();
  const { socket, setSnackBar } = useContext();
  const currentUser = useSelector(state => state.user.currentUser);
  const dispatch = useDispatch();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [popover, setPopover] = useState({});
  const [query, setQuery] = useState("");
  const [unseens, setUnseens] = useState({
    notifications: 0
  });
  const [notify, setNotify] = useState([]);
  const stateRef = useRef({
    url: `/users/notifications`
  });
  const infiniteScrollRef = useRef();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        setUnseens(
          await http.get("/users/unseen-alerts?excludeUser=true", {
            withCredentials: true
          })
        );
      } catch (message) {
        setSnackBar(message);
      }
    })();
  }, [setSnackBar]);

  useEffect(() => {
    if (currentUser?.id) {
      socket.on("notification", (n, filtered) => {
        // console.log(
        // "socket seeting unseens....",
        //   n,
        //   currentUser.id,
        //   !!n.to,
        //   filtered
        // );
        if (
          n.to
            ? n.to.id === currentUser.id
            : n.reports[currentUser.id] &&
              (n.type === "comment"
                ? (n.from && (n.from.id || n.from)) !== currentUser.id
                : true)
        ) {
          let notifiId, _notifiId;
          if (filtered) {
            if (_notifiId !== n.id) {
              _notifiId = n.id;
              let notified = false;
              setUnseens(unseens => {
                if (!notified) {
                  notified = true;
                  return {
                    ...unseens,
                    notifications: unseens.notifications - 1
                  };
                }
                return unseens;
              });
              if (popover.for === "notifications" && popover.open) {
                let length;
                infiniteScrollRef.current.setData(prev => {
                  if (!length) length = prev.data.length - 1;
                  if (prev.data.length <= length) return prev;
                  return {
                    ...prev,
                    data: prev.data.filter(({ id }) => id !== n.id)
                  };
                });
              }
            }
          } else if (notifiId !== n.id) {
            notifiId = n.id;
            _notifiId = undefined;
            let notified = false;
            setUnseens(unseens => {
              if (notified) return unseens;
              notified = true;
              return {
                ...unseens,
                notifications: unseens.notifications + 1
              };
            });
            if (popover.for === "notifications" && popover.open) {
              let length;
              infiniteScrollRef.current.setData(prev => {
                if (!length) length = prev.data.length + 1;
                if (prev.data.length >= length) return prev;
                return {
                  ...prev,
                  data: [n, ...prev.data]
                };
              });
            } else
              stateRef.current[popover.type] = {
                data: [n]
              };
          }
        }
      });
    } else {
      // console.log(" wont updat notif since it is you or not allowed");
      return;
    }
  }, [socket, currentUser?.id, popover]);

  const _handleAction = useCallback(() => {}, []);

  const toggleTheme = () => {
    dispatch(toggleThemeMode());
  };
  const handleDrawer = open => e => {
    if (e && e.type === "keydown" && (e.key === "Tab" || e.key === "Shift"))
      return;
    setOpenDrawer(open);
  };

  const handleSubmit = e => {
    e.preventDefault();
    e.stopPropagation();
    if (query) navigate(`/search?q=${query}`);
  };

  const selectElem = currentUser ? (
    <FormControl variant="standard" sx={{ width: "100%", minWidth: "180px" }}>
      <Select
        defaultValue={`@${currentUser.username}`}
        value={`@${currentUser.username}`}
        sx={{
          backgroundColor: "background.alt",
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
        renderValue={() => `@${currentUser.username}`}
      >
        <StyledMenuItem
          value={`@${currentUser.username}`}
          sx={{
            opacity: 0,
            pointerEvents: "none",
            m: 0,
            p: 0,
            height: 0,
            minHeight: 0
          }}
        />
        {{
          profilePage: [
            {
              to: `/u/${currentUser.id}?compose=create-post`,
              label: "Create Post",
              icon: AddIcon
            },
            {
              to: `/u/${currentUser.id}?compose=create-short`,
              label: "Create Short",
              icon: AddToQueueIcon
            },
            {
              to: `/u/${currentUser.id}?view=user-posts`,
              label: "My Posts",
              icon: ListAltIcon
            },
            {
              to: `/u/${currentUser.id}?view=user-shorts`,
              label: "My Shorts",
              icon: VideoLibraryIcon
            }
          ],
          homePage: [
            {
              to: `/u/${currentUser.id}`,
              label: "Profile",
              icon: PersonIcon
            }
          ]
        }[routePage].map((l, i) =>
          l.nullify ? null : (
            <div>
              {l.label && (
                <StyledMenuItem
                  key={i}
                  value={l.label}
                  to={l.to}
                  component={StyledLink}
                >
                  <l.icon />
                  <Typography>{l.label}</Typography>
                </StyledMenuItem>
              )}
              <Divider />
            </div>
          )
        )}
        <StyledMenuItem component={StyledLink} to="/shorts">
          <SlideshowIcon />
          <Typography>Shorts</Typography>
        </StyledMenuItem>
        <Divider />
        <StyledMenuItem component={StyledLink} to="/auth/signin">
          <LoginIcon />
          <Typography> Log Out</Typography>
        </StyledMenuItem>
      </Select>
    </FormControl>
  ) : (
    <IconButton component={Link} to="/auth/signin">
      <LoginIcon />
    </IconButton>
  );

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
      component="form"
      onSubmit={handleSubmit}
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
  );

  const renderPopover = () => {
    // // console.log(unseens.notifications, " count..");
    const markNotification = async (index, e) => {
      const { setData, data } = infiniteScrollRef.current;
      let _data = data;
      try {
        e.stopPropagation();
        e.preventDefault();
        if (popover.type === "marked") {
          stateRef.current[popover.type] = {
            data:
              index === -1
                ? data.data.map(d => {
                    d.reports[currentUser.id].marked = true;
                    return {
                      ...d
                    };
                  })
                : (data.data[index].reports[currentUser.id].marked = true) && [
                    ...data.data
                  ]
          };
        } else {
          unseens[popover.for] &&
            setUnseens({
              ...unseens,
              [popover.for]:
                unseens[popover.for] - (index === -1 ? data.length : 1)
            });

          setData({
            ...data,
            data:
              index === -1
                ? data.data.filter((d, i) => {
                    return index !== i;
                  })
                : []
          });
          await http.patch(
            `/users/${popover.for}/mark`,
            index === -1 ? data.data.map(({ id }) => id) : [data.data[index].id]
          );
        }
      } catch (err) {
        console.log(err, "err handler");
        if (popover.type === "unmarked") {
          setSnackBar("Failed to mark notification!");
          setData({
            ..._data,
            data:
              index === -1
                ? _data.data.map(d => {
                    d.reports[currentUser.id].marked = false;
                    return {
                      ...d
                    };
                  })
                : !(_data.data[index].reports[
                    currentUser.id
                  ].marked = false) && [..._data.data]
          });
          unseens[popover.for] &&
            setUnseens({
              ...unseens,
              [popover.for]:
                unseens[popover.for] + (index === -1 ? data.length : 1)
            });
        }
      } finally {
        // _data = undefined;
      }
    };
    // // console.log(popover.for, popover.type, "pop over for");
    switch (popover.for) {
      case "notifications":
        const btnSx = {
          flex: 1,
          color: "common.dark",
          borderRadius: 0,
          "&:hover": {
            border: "unset",
            border: "none",
            border: "1px solid #fff",
            borderTopColor: "divider",
            borderRadius: 0,

            borderRightColor: "transparent",

            "&:last-of-type": {
              borderLeft: "1px solid #fff",
              borderLeftColor: "divider"
            }
          },
          border: "none",
          border: "1px solid #fff",
          borderTopColor: "divider",
          "&:last-of-type": {
            borderLeft: "1px solid #fff",
            borderLeftColor: "divider"
          },

          "&:hover:not(:last-of-type)": {
            borderRightColor: "transparent !important"
          }
        };
        return (
          <>
            <Stack
              sx={{
                p: 2
              }}
            >
              <Stack justifyContent="normal">
                <MarkEmailUnreadSharpIcon fontSize="large" />
                <Typography variant="h4" fontWeight="bold" color="common.dark">
                  Notices
                </Typography>
              </Stack>
              {popover.type === "unmarked" ? (
                <Typography
                  style={{ cursor: "pointer" }}
                  onClick={e => markNotification(-1, e)}
                >
                  Mark all
                </Typography>
              ) : (
                <Typography
                  style={{ cursor: "pointer" }}
                  // onClick={e => deleteNotification(-1, e)}
                >
                  Delete all
                </Typography>
              )}
            </Stack>
            <InfiniteScroll
              key={popover.type}
              ref={infiniteScrollRef}
              handleAction={_handleAction}
              url={`/users/notifications`}
              searchParams={`type=${popover.type}`}
              // defaultData={stateRef.current[popover.type]}
            >
              {({ setObservedNode, data: { data } }) => {
                // data = data.length ? data : Array.from(new Array(30));
                // console.log(data, currentUser.id, "notifica data");
                // return [];
                // data = [data[0], data[0], data[0], data[0], data[0], data[0]];

                return data.length ? (
                  <List sx={{ mt: 0, p: 0 }}>
                    {data.map((n, i) => {
                      const isOwner =
                        (n.document ? n.document.user.id : n.from.id) ===
                        currentUser.id;
                      // console.log(
                      //   n.reports[currentUser.id],
                      //   popover.type,
                      //   currentUser.id,
                      //   " rpoerts "
                      // );
                      return (
                        <React.Fragment key={i}>
                          <ListItemButton
                            ref={
                              i === data.length - (data.length > 4 ? 3 : 1)
                                ? setObservedNode
                                : null
                            }
                            onClick={e => markNotification(i, e)}
                            component="li"
                            alignItems="flex-start"
                            sx={
                              n.reports[currentUser.id]?.marked
                                ? {}
                                : {
                                    backgroundColor: "primary.light",
                                    flexWrap: "wrap",
                                    "&:hover": {
                                      backgroundColor: "background.alt"
                                    }
                                  }
                            }
                          >
                            <ListItemAvatar
                              sx={{
                                minWidth: "40px",
                                ".MuiSvgIcon-root": {
                                  fontSize: "3em"
                                }
                              }}
                            >
                              {/* <Avatar
                                alt={n.type}
                                src={
                                  n.to
                                    ? n.to.photoUrl
                                    : n.document.user.photoUrl
                                }
                              /> */}
                              {{
                                like: <FavoriteIcon color="error" />,
                                follow: <PersonIcon color="primary" />
                              }[n.type] || (
                                <NotificationsIcon color="primary" />
                              )}
                            </ListItemAvatar>
                            <ListItemText
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                "& *": {
                                  color: "primary.dark"
                                }
                              }}
                              primary={
                                {
                                  follow: "New Follower"
                                }[n.type]
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    sx={{ display: "inline" }}
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    @{n.from.username}
                                  </Typography>
                                  <span>
                                    {" "}
                                    —{" "}
                                    {
                                      {
                                        follow: `followed you`,
                                        like: isOwner
                                          ? `liked your ${n.docType}`
                                          : `liked ${
                                              (n.document
                                                ? n.document.user.id
                                                : currentUser.id) === n.from.id
                                                ? "his"
                                                : `a post by ${
                                                    n.document
                                                      ? n.document.user.username
                                                      : n.from.username
                                                  }`
                                            } post`,
                                        comment: isOwner ? (
                                          <span>
                                            commented on your
                                            <StyledLink
                                              to={
                                                n.document &&
                                                `/${n.document.docType}/${n.document.id}`
                                              }
                                            >
                                              {n.document && n.document.docType}
                                            </StyledLink>
                                          </span>
                                        ) : (
                                          <span>
                                            commented on a{" "}
                                            <StyledLink
                                              to={
                                                n.document &&
                                                `/${n.document.docType}/${n.document.id}`
                                              }
                                            >
                                              {n.document && n.document.docType}
                                            </StyledLink>{" "}
                                            you{" "}
                                            {{
                                              like: "liked"
                                            }[
                                              (n.reports[currentUser.id]?.type)
                                            ] || "viewed"}{" "}
                                            {moment(n.createdAt).fromNow()}.
                                          </span>
                                        )
                                      }[n.type]
                                    }
                                  </span>
                                  <Typography>
                                    {
                                      {
                                        comment: n.document && n.document.text
                                      }[n.type]
                                    }
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                            {popover.type === "unmarked" ? (
                              <Checkbox
                                icon={<RadioButtonUncheckedIcon />}
                                checkedIcon={<CircleIcon />}
                                onClick={e => markNotification(i, e)}
                              />
                            ) : (
                              <DeleteIcon />
                            )}
                          </ListItemButton>
                          {i === data.length - 1 ? null : <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                ) : (
                  <div>
                    {
                      {
                        unmarked: "You dont have a new notification",
                        marked: "No previous notifications"
                      }[popover.type]
                    }
                  </div>
                );
              }}
            </InfiniteScroll>
            <ButtonGroup
              sx={{
                width: "100%",
                // "&>*":  ,
                // m: 2,
                "&:not(:last-of-type)": {
                  borderRightColor: "transparent"
                }
              }}
            >
              <Button
                sx={btnSx}
                onClick={() => setPopover({ ...popover, type: "unmarked" })}
              >
                Unmarked
              </Button>
              <Button
                sx={{
                  ...btnSx
                  // borderRight: "1px solid #fff",
                  // borderRightColor: "red !important"
                }}
                onClick={() => setPopover({ ...popover, type: "marked" })}
              >
                Marked
              </Button>
            </ButtonGroup>
          </>
        );
      default:
        return null;
    }
  };

  const showPopover = async (
    { currentTarget },
    popoverFor,
    type = "unmarked"
  ) => {
    // _showpopover;
    // console.log(popoverFor, "popover for");
    setPopover({
      open: true,
      anchorEl: currentTarget,
      for: popoverFor,
      type
    });
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
              <IconButton onClick={e => showPopover(e, "notifications")}>
                <StyledBadge
                  badgeContent={unseens.notifications}
                  color="primary"
                  max={999}
                >
                  <NotificationsIcon />
                </StyledBadge>
              </IconButton>
              <IconButton>
                <StyledBadge badgeContent={1000} color="primary" max={999}>
                  <MessageIcon />
                </StyledBadge>
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
              title: "Notification",
              icon: NotificationsIcon,
              onClick: e => showPopover(e, "notifications"),
              badgeContent: unseens.notifications
            },
            {
              nullify: !currentUser,
              title: "Chat",
              icon: MessageIcon
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
                  <StyledBadge
                    badgeContent={l.badgeContent}
                    color="primary"
                    max={999}
                    sx={{
                      ".MuiBadge-badge": {
                        right: 2,
                        top: 8
                      }
                    }}
                  >
                    <IconButton>
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
        {selectElem}
        {searchElem}
      </SwipeableDrawer>
      <Popover
        open={popover.open}
        anchorEl={popover.anchorEl}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 450
          }
        }}
        onClose={() => {
          setPopover({
            ...popover,
            open: false
          });
          setTimeout(() => {
            setPopover({});
          }, 5000);
        }}
      >
        {renderPopover()}
      </Popover>
    </>
  );
};

export default Navbar;
