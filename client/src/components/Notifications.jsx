import React, { useRef, useEffect, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  ButtonGroup,
  Button,
  IconButton,
  Checkbox,
  Stack,
  Typography,
  List,
  ListItemButton,
  Box,
  useTheme,
  Avatar
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import MarkEmailUnreadSharpIcon from "@mui/icons-material/MarkEmailUnreadSharp";
import InfiniteScroll from "./InfiniteScroll";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/Delete";
import useDeleteDispatch from "hooks/useDeleteDispatch";
import { LoadingDot } from "components/Loading";
import EmptyData from "components/EmptyData";
import PersonIcon from "@mui/icons-material/Person";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useContext } from "context/store";
import { alpha } from "@mui/material/styles";
import { Link } from "react-router-dom";

const Notifications = ({
  markNotification,
  defaultType = "unmarked",
  cache = {
    unmarked: {},
    marked: {}
  },
  dataSx,
  sx
}) => {
  const { socket } = useContext();
  const [disabled, setDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [type, setType] = useState(defaultType);
  const cid = useSelector(state => state.user.currentUser?.id);
  const stateRef = useRef({
    notiDelKeyData: {}
  });
  const selectedColor = alpha(useTheme().palette.primary.main, "0.08");
  const _handleAction = useCallback((reason, res, cacheData) => {
    switch (reason) {
      case "filter":
        infiniteScrollRef.current.setData(data => ({
          ...data,
          data: data.data.filter((d, i) => {
            if (d.id === res) {
              if (cacheData)
                stateRef.current.notiDelKeyData[res] = {
                  index: i,
                  data: d
                };
              return false;
            }
            return true;
          })
        }));
        break;
      case "clear-cache":
        delete stateRef.current.notiDelKeyData[res];
        break;
      case "new":
        if (stateRef.current.notiDelKeyData[res]) {
          infiniteScrollRef.current.data.data.splice(
            stateRef.current.notiDelKeyData[res].index,
            0,
            stateRef.current.notiDelKeyData[res].data
          );
          infiniteScrollRef.current.setData(data => ({
            ...data
          }));
        }
        break;
      case "data":
        console.log(res);
        if (res.dataSize) setDisabled(false);
        break;
      case "close":
        setProcessing(false);
        setDisabled(stateRef.current.disabled || false);
        break;
      default:
        break;
    }
  }, []);
  const { handleDelete, activeDelItem } = useDeleteDispatch({
    handleAction: _handleAction
  });
  const infiniteScrollRef = useRef();

  useEffect(() => {
    const handleFilter = notices => {
      infiniteScrollRef.current.setData({
        ...infiniteScrollRef.data,
        data: infiniteScrollRef.current.data.data.filter(
          ({ id }) => !notices.includes(id)
        )
      });
    };

    let appended = false;
    const handleAppend = (n, { filter, isNew }) => {
      if (appended) return;
      appended = true;
      console.log(" append e...");
      if (n.to.id === cid && type === "unmarked") {
        if (filter)
          infiniteScrollRef.current.setData({
            ...infiniteScrollRef.current.data,
            data: infiniteScrollRef.current.data.data.map(_n =>
              _n.id === n.id ? n : _n
            )
          });
        else {
          infiniteScrollRef.current.setData({
            ...infiniteScrollRef.current.data,
            data: isNew
              ? [n, ...infiniteScrollRef.current.data.data]
              : infiniteScrollRef.current.data.data.map(_n =>
                  _n.id === n.id ? n : _n
                )
          });
        }
      }
    };

    socket.on("notification", handleAppend);
    socket.on("filter-notifications", handleFilter);

    return () => {
      socket.removeEventListener("notification", handleAppend);
      socket.removeEventListener("filter-notifications", handleFilter);
    };
  }, [socket, type, cid]);

  const handleTabSwitch = (type, e = {}) => {
    e && e.stopPropagation && e.stopPropagation();
    setProcessing(false);
    setDisabled(e.disabled !== false);
    type && setType(type);
  };
  useEffect(() => {
    if (cache[type].filter) {
      const cachedData = cache[type].data;
      infiniteScrollRef.current.setData({
        ...infiniteScrollRef.current.data,
        data: infiniteScrollRef.current.data.data.filter(
          ({ id }) => !cachedData.includes(id)
        )
      });
      cache[type] = {};
    }
  }, [cache, type]);

  const handleDeleteAll = e => {
    e.stopPropagation();
    stateRef.current.disabled = true;
    setProcessing(true);
    const data = infiniteScrollRef.current.data.data;
    data.forEach((d, i) => {
      stateRef.current.notiDelKeyData[d.id] = {
        index: i,
        data: d
      };
    });
    infiniteScrollRef.current.setData({
      ...infiniteScrollRef.current.data,
      data: []
    });
    handleDelete(`/users/notifications`, data, {
      label: "notification"
    });
  };

  const deleteOne = id => e => {
    e.stopPropagation();
    if (activeDelItem !== "all" && activeDelItem !== id) {
      setProcessing(true);
      handleDelete(`/users/notifications`, [id], {
        label: "notification"
      });
    }
  };

  const markOne = (i, to) => e => {
    e.stopPropagation();
    if (type === "unmarked") {
      setProcessing(true);
      markNotification(i, infiniteScrollRef.current, {
        to,
        handleState: handleTabSwitch,
        cacheType: "marked"
      });
    }
  };

  return (
    <>
      <InfiniteScroll
        key={type}
        ref={infiniteScrollRef}
        url={`/users/notifications`}
        searchParams={`type=${type}`}
        defaultData={
          !cache[type].filter && {
            data: cache[type].data || []
          }
        }
        handleAction={_handleAction}
        sx={sx}
      >
        {({ setObservedNode, data: { data }, dataChanged }) => {
          return (
            <>
              <Stack
                sx={{
                  p: 2,
                  borderBottom: "1px solid currentColor",
                  borderBottomColor: "divider"
                }}
              >
                <Stack justifyContent="normal">
                  <MarkEmailUnreadSharpIcon
                    sx={{
                      color: "primary.main"
                    }}
                    fontSize="large"
                  />
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    Notices
                  </Typography>
                </Stack>
                {processing ? (
                  <LoadingDot sx={{ p: 1 }} />
                ) : type === "unmarked" ? (
                  <Button disabled={disabled} onClick={markOne(-1)}>
                    Mark all
                  </Button>
                ) : (
                  <Button disabled={disabled} onClick={handleDeleteAll}>
                    Delete all
                  </Button>
                )}
              </Stack>
              <Box sx={dataSx}>
                {data.length ? (
                  <List sx={{ mt: 0, p: 0 }}>
                    {data.map((n, i) => {
                      const renderMsg = () => {
                        switch (n.type) {
                          case "like":
                          case "comment":
                            const usersLen = n.users.length - 1;
                            const moreInfo = ` ${
                              {
                                like: "liked",
                                comment: "shared their view about"
                              }[n.type]
                            } your ${
                              n.docType === "comment"
                                ? "comment"
                                : n.document.user?.id === cid
                                ? n.docType
                                : ""
                            }`;
                            return `@${n.users[0].username}${
                              usersLen
                                ? ` and ${
                                    usersLen - 1
                                      ? `${usersLen} others ${moreInfo} `
                                      : ` @${n.users[1].username} ${moreInfo}`
                                  }`
                                : moreInfo
                            }`;
                          default:
                            break;
                        }
                      };
                      return (
                        <ListItemButton
                          key={n.id}
                          ref={
                            dataChanged && i === data.length - 1
                              ? node => node && setObservedNode(node)
                              : undefined
                          }
                          component="li"
                          sx={{
                            borderBottom: "1px solid currentColor",
                            borderBottomColor: "divider",
                            alignItems: "flex-start",
                            "&:hover": {
                              backgroundColor: selectedColor
                            }
                          }}
                          onClick={markOne(
                            i,
                            n.document
                              ? `/${n.docType}s/${n.document.id}`
                              : n.users[0]
                              ? `/u/${n.users[0].id}`
                              : ""
                          )}
                        >
                          <ListItemAvatar
                            sx={{
                              minWidth: "40px",
                              ".MuiSvgIcon-root": {
                                fontSize: "3em"
                              },
                              alignSelf: "flex-start"
                            }}
                          >
                            {{
                              like: (
                                <FavoriteIcon sx={{ color: "common.heart" }} />
                              ),
                              follow: (
                                <PersonIcon
                                  sx={{
                                    color: "primary.main"
                                  }}
                                />
                              )
                            }[n.type] || (
                              <NotificationsIcon
                                sx={{
                                  color: "primary.main"
                                }}
                              />
                            )}
                          </ListItemAvatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack flexWrap="wrap" justifyContent="normal">
                              {n.users.map(({ id, photoUrl }) => (
                                <Link key={id} to={`/u/${id}`}>
                                  <Avatar src={photoUrl} alt="" />
                                </Link>
                              ))}
                            </Stack>
                            <Typography sx={{ mt: 1 }}>
                              {
                                {
                                  follow: `@${n.users[0].username} followed  ${
                                    n.to.id === cid ? "you" : ""
                                  }`,
                                  like: renderMsg(),
                                  comment: renderMsg()
                                }[n.type]
                              }
                            </Typography>
                            {n.document?.text ? (
                              <Box sx={{ mt: "4px" }}>
                                <Typography
                                  variant="h5"
                                  sx={{ display: "inline" }}
                                >
                                  {n.document.text}...
                                </Typography>
                                {n.document.moreText ? (
                                  <Typography component="span">...</Typography>
                                ) : null}
                              </Box>
                            ) : null}
                          </Box>
                          <Box
                            sx={{
                              alignSelf: "flex-start"
                            }}
                          >
                            {type === "unmarked" ? (
                              <Checkbox
                                icon={<RadioButtonUncheckedIcon />}
                                checkedIcon={<CircleIcon />}
                                onClick={markOne(i)}
                              />
                            ) : (
                              <IconButton
                                sx={{
                                  backgroundColor: "action.selected"
                                }}
                                onClick={deleteOne(n.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        </ListItemButton>
                      );
                    })}
                  </List>
                ) : (
                  <EmptyData
                    sx={{
                      py: 2
                    }}
                    label={
                      {
                        unmarked:
                          "You don't have any notification at the moment.",
                        marked: "Your notification box is empty at the moment."
                      }[type]
                    }
                  />
                )}
              </Box>
            </>
          );
        }}
      </InfiniteScroll>

      <ButtonGroup
        sx={{
          width: "100%",
          "& > .MuiButton-root": {
            flex: 1,
            borderRadius: 0,
            outline: 0,
            border: "0",
            border: "1px solid transparent",
            borderTopColor: "divider",
            "&:last-of-type": {
              borderLeftColor: "divider"
            },
            "&:hover": {
              border: "1px solid transparent",
              borderTopColor: "divider",
              "&:first-of-type": {
                borderRightColor: "transparent"
              },
              "&:last-of-type": {
                borderLeftColor: "divider"
              }
            }
          }
        }}
      >
        <Button
          sx={{
            backgroundColor: type === "unmarked" ? selectedColor : undefined
          }}
          onClick={e => handleTabSwitch("unmarked", e)}
        >
          Unmarked
        </Button>
        <Button
          sx={{
            backgroundColor: type === "marked" ? selectedColor : undefined
          }}
          onClick={e => handleTabSwitch("marked", e)}
        >
          Marked
        </Button>
      </ButtonGroup>
    </>
  );
};

Notifications.propTypes = {};

export default Notifications;
