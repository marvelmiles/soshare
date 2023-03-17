import React, { useState } from "react";
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
import DeleteDialog from "./DeleteDialog";
import { useContext } from "redux/store";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import useFollowDispatch from "hooks/useFollowDispatch";
import EditIcon from "@mui/icons-material/Edit";
import { Link } from "react-router-dom";
const MoreActions = ({
  composeDoc: { id, user, document, docType, index },
  isOwner,
  handleAction,
  Icon = MoreHorizIcon,
  title,
  urls,
  isAuth,
  btnSx
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { toggleFollow, isProcessingFollow, isFollowing } = useFollowDispatch(
    user.id
  );
  const closePopover = e => {
    if (e) {
      e.stopPropagation();
    }
    setAnchorEl(null);
  };
  const { setSnackBar } = useContext();
  const handleDontRecommend = async () => {
    try {
      await http.put(`/users/recommendation/blacklist/${user.id}`);
      handleAction("filter", id, user.id);
      setSnackBar({
        message: `You blacklisted @${user.username}`,
        severity: "success"
      });
    } catch (msg) {
      setSnackBar(msg);
    }
  };
  const _handleAction = async reason => {
    const closeDialog = () => {
      // handleAction("update", { id, pause: false });
      setOpenDeleteDialog(false);
    };
    // console.log(reason, docType, document, "handle more");
    switch (reason) {
      case "delete":
        try {
          // return console.log(reason, "document");
          // handleAction("filter", id, true);
          return await http.delete(urls.delPath);
          // handleAction("clear-cache");
        } catch (msg) {
          console.log("err o del com ");
          setSnackBar(msg);
          // handleAction("new");
        }
        break;
      case "update":
        // handleAction(reason, data);
        break;
    }
    // closeDialog();
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
            text: `${isFollowing ? "Unfollow" : "Follow"} ${user.username}`,
            onClick: toggleFollow,
            nullify: isOwner
          },
          {
            icon: DoDisturbAltOutlinedIcon,
            text: `Don't recommend @${user.username}`,
            onClick: handleDontRecommend,
            nullify: isOwner
          },
          {
            icon: EditIcon,
            nullify: !isOwner,
            text: `Edit ${title}`,
            url: `/${title}/${id}?edit=true`
          },
          {
            icon: DeleteIcon,
            nullify: !(isAuth || isOwner),
            text: `Delete ${title}`,
            onClick: () => {
              setOpenDeleteDialog(true);
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
        key={urls.delPath}
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
