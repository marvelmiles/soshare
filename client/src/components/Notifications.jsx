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
import { Link } from "react-router-dom";
import moment from "moment";
import PostWidget from "components/PostWidget";
import { StyledLink } from "./styled";
import Tooltip from "@mui/material/Tooltip";
import UserTip from "tooltips/UserTip";

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
  const t = useRef();
  const { socket } = useContext();
  const [disabled, setDisabled] = useState(true);
  const [type, setType] = useState(defaultType);
  const cid = useSelector(state => state.user.currentUser?.id);
  const stateRef = useRef({
    registeredIds: {}
  });
  const _handleAction = useCallback((reason, options = {}) => {
    const { document, dataSize } = options;
    switch (reason) {
      case "filter":
        infiniteScrollRef.current.setData(data => ({
          ...data,
          data: data.data.filter(({ id }, i) => {
            if (id === document.id) {
              stateRef.current.registeredIds[id] = i;
              return false;
            }
            return true;
          })
        }));
        break;
      case "new":
        const index = stateRef.current.registeredIds[document.id];
        if (index > -1) {
          infiniteScrollRef.current.data.data.splice(index, 0, document);
          infiniteScrollRef.current.setData(data => ({
            ...data
          }));
        }
        break;

      case "data":
        if (dataSize) setDisabled(false);
        else setDisabled(true);
        break;
      case "close":
        setDisabled(true);
        break;
      default:
        break;
    }
  }, []);
  const { handleDelete, isProcessingDelete } = useDeleteDispatch({
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
    cache[type].data = [];
  }, [cache, type]);

  const handleTabSwitch = (type, e = {}) => {
    e && e.stopPropagation && e.stopPropagation();
    setDisabled(e.disabled !== false);
    type && setType(type);
  };

  const handleDeleteAll = e => {
    e.stopPropagation();
    const data = infiniteScrollRef.current.data.data;
    infiniteScrollRef.current.setData({
      ...infiniteScrollRef.current.data,
      data: []
    });
    setDisabled(true);
    handleDelete(`/users/notifications`, data, {
      label: "notification"
    });
  };

  const deleteOne = notice => e => {
    e.stopPropagation();
    handleDelete(`/users/notifications`, [notice], {
      label: "notification"
    });
  };

  const markOne = (i, to) => e => {
    e.stopPropagation();
    if (type === "unmarked")
      markNotification(i, infiniteScrollRef.current, {
        to,
        handleState: handleTabSwitch,
        cacheType: "marked"
      });
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
        withCredentials={!!cid}
        exclude={(cache[type].data || []).map(n => n.id).join(",")}
      >
        {({ data: { data } }) => {
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
                {isProcessingDelete ? (
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
                        let withRo;
                        const formatedDate = moment(n.createdAt).fromNow();
                        const moreInfo = (
                          <span>
                            {
                              {
                                like: " liked",
                                comment: ` soshared a ${n.docType} on`
                              }[n.type]
                            }{" "}
                            {n.document?.user?.id === cid ||
                            (withRo = n.document?.document?.user?.id === cid)
                              ? "your"
                              : "a"}{" "}
                            {withRo ? (
                              <StyledLink
                                style={{ color: "inherit" }}
                                to={`/${n.document.docType}s/${n.document.document.id}`}
                              >
                                {n.document.docType}
                              </StyledLink>
                            ) : n.document ? (
                              n.docType
                            ) : (
                              <StyledLink
                                style={{ color: "inherit" }}
                                to={`/${n.docType}s/${n.document?.id || ""}`}
                              >
                                {n.docType}
                              </StyledLink>
                            )}{" "}
                            {formatedDate}.
                          </span>
                        );
                        const username = (
                          <Tooltip
                            arrow={false}
                            title={
                              <UserTip
                                user={n.users[0]}
                                isOwner={cid === n.users[0].id}
                              />
                            }
                          >
                            <span>{n.users[0].username}</span>
                          </Tooltip>
                        );
                        switch (n.type) {
                          case "like":
                          case "comment":
                            const usersLen = n.users.length - 1;
                            return (
                              <div>
                                @{username}
                                {usersLen
                                  ? ` and ${
                                      usersLen - 1
                                        ? `${usersLen} others${moreInfo} `
                                        : ` @${n.users[1].username}${moreInfo}`
                                    }`
                                  : moreInfo}
                              </div>
                            );
                          case "follow":
                            return (
                              <div>
                                @{username} followed
                                {n.to.id === cid ? " you " : " a friend "}
                                {formatedDate}.
                              </div>
                            );
                          case "delete":
                            return (
                              <div>
                                @{username} deleted your
                                {n.cacheType +
                                  (n.cacheDocs.length > 1 ? " s " : " ")}
                                on their{" "}
                                <StyledLink
                                  to={`/${n.docType}s/${n.document.id}`}
                                >
                                  {n.docType}
                                </StyledLink>{" "}
                                {formatedDate}.
                              </div>
                            );
                          default:
                            return (
                              <div>
                                @{username}
                                {moreInfo}
                              </div>
                            );
                        }
                      };
                      return (
                        <ListItemButton
                          key={n.id}
                          disableRipple
                          component="li"
                          sx={{
                            "&": {
                              borderBottom: "1px solid currentColor",
                              borderBottomColor: "divider",
                              alignItems: "flex-start",
                              zIndex: 2
                            },
                            "&:hover": {
                              backgroundColor: "common.selectedHover"
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
                              {renderMsg()}
                            </Typography>
                            {n.document ? (
                              <PostWidget post={n.document} enableSnippet />
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
                                onClick={deleteOne(n)}
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
            backgroundColor: type === "unmarked" ? "common.hover" : undefined
          }}
          onClick={e => handleTabSwitch("unmarked", e)}
        >
          Unmarked
        </Button>
        <Button
          sx={{
            backgroundColor: type === "marked" ? "common.hover" : undefined
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
