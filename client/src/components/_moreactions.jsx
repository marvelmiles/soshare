import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import DoDisturbAltOutlinedIcon from "@mui/icons-material/DoDisturbAltOutlined";
import http from "api/http";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteDialog from "components/DeleteDialog";
import { useContext } from "context/store";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import useDeleteDispatch from "hooks/useDeleteDispatch";
import useFollowDispatch from "hooks/useFollowDispatch";
import EditIcon from "@mui/icons-material/Edit";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
const MoreActions = ({
  post,
  handleAction,
  Icon = MoreHorizIcon,
  title,
  urls,
  isRO,
  btnSx,
  docType,
  nullifyEdit = docType === "comment"
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { isLoggedIn, isOwner, settings } = useSelector(state => {
    const currentUser = state.user.currentUser || {};
    return {
      isOwner: currentUser.id === post.user?.id,
      isLoggedIn: !!currentUser.id,
      ...currentUser
    };
  });
  const { handleDelete } = useDeleteDispatch({
    url: urls.delPath,
    handleAction
  });
  const { toggleFollow, isFollowing } = useFollowDispatch(post.user);
  useEffect(() => {
    console.log(" composing...");
  }, [post]);
  
    const _handleAction = useCallback(
    async (reason, res) => {
      // console.log(reason, " closing,,,");
      if (reason === "mounted") {
        if (res.open && res === "delete-dialog")
          handleAction("update", { id: post.id, pause: true });
        return;
      }
      const closeDialog = () => {
        handleAction("update", { id: post.id, pause: false });
        setOpenDeleteDialog(false);
      };
      closeDialog();
      switch (reason) {
        case "delete":
          handleDelete(undefined, [post], { label: docType });
          break;
      }
    },
    [post, docType, handleAction, handleDelete]
  );

  const closePopover = e => {
    if (e) {
      e.stopPropagation();
    }
    setAnchorEl(null);
  };
  const { setSnackBar, setComposeDoc } = useContext();
 
  const handleDontRecommend = async () => {
    if (isLoggedIn) {
      try {
        setComposeDoc({
          ...post,
          docType,
          reason: "blacklisted-user",
          action: "filter"
        });
        await http.put(`/users/recommendation/blacklist/${post.user.id}`);
        setSnackBar({
          message: `You blacklisted @${post.user.username}`,
          severity: "success"
        });
        setComposeDoc({
          ...post,
          docType,
          reason: "blacklisted-user",
          action: "clear-cache"
        });
      } catch (msg) {
        setComposeDoc({
          ...post,
          docType,
          reason: "blacklisted-user",
          action: "new"
        });
        setSnackBar(msg);
      }
    } else setSnackBar();
  };

  return (
    <>
      <IconButton
        onClick={e => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        sx={btnSx}
      >
        <Icon />
      </IconButton>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closePopover}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: "250px"
          }
        }}
      >
        {[
          {
            icon: ShareOutlinedIcon,
            text: "Share"
          },
          {
            icon: isFollowing ? PersonRemoveIcon : PersonAddAlt1Icon,
            text: `${isFollowing ? "Unfollow" : "Follow"} ${
              post.user.username
            }`,
            onClick: toggleFollow,
            nullify: isOwner
          },
          {
            icon: DoDisturbAltOutlinedIcon,
            text: `Don't recommend @${post.user.username}`,
            onClick: handleDontRecommend,
            nullify: isOwner
          },
          {
            icon: EditIcon,
            nullify: nullifyEdit || !isOwner,
            text: `Edit ${title}`,
            url: `/${docType}s/${post.id}?edit=true`
          },
          {
            icon: DeleteIcon,
            nullify: !(isRO || isOwner),
            text: `Delete ${title}`,
            onClick: () => {
              console.log(" to dele ", settings);
              if (!isLoggedIn) return setSnackBar();
              if (settings.hideDelWarning) _handleAction("delete");
              else setOpenDeleteDialog(true);
            }
          }
        ].map((l, i) =>
          l.nullify ? null : (
            <ListItemButton
              key={i}
              component={l.url ? Link : "ul"}
              onClick={e => {
                e.stopPropagation();
                closePopover(e);
                l.onClick && l.onClick();
              }}
              to={l.url && l.url}
            >
              {l.icon ? (
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <l.icon />
                </ListItemIcon>
              ) : null}
              <ListItemText
                primary={l.text}
                primaryTypographyProps={{
                  sx: {
                    textTransform: "capitalize",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap"
                  }
                }}
              />
            </ListItemButton>
          )
        )}
      </Popover>
      <DeleteDialog
        key={urls.delPath + post.id}
        open={openDeleteDialog}
        openFor="delete"
        handleAction={_handleAction}
        title={title}
      />
    </>
  );
};

MoreActions.propTypes = {};

export default MoreActions;
