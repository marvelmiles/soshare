import React, { useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { StyledTypography, spin } from "../styled";
import { Typography, Avatar, Button, CircularProgress } from "@mui/material";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "redux/userSlice";
import { useContext } from "redux/store";
import http from "api/http";
import { useNavigate } from "react-router-dom";
import DeleteDialog from "components/DeleteDialog";
CircularProgress.defaultProps = {
  size: 20,
  sx: {
    color: "primary.dark"
  }
};
const ShortFooter = ({
  miniShort,
  text = "",
  views = 0,
  user = {},
  isOwner,
  id,
  handleAction
}) => {
  const [updatingFollowing, setUpdatingFollowing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { following } = useSelector(state => state.user.currentUser || {});
  const { setSnackBar } = useContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  //   user.username =
  //     "Deserunt laboris aute labore cillum laborum laborum cupidatat pariatur Enim excepteur cillum exercitation est nulla. qui user.username";
  //   text =
  //     "textertetyuio Nostrud ipsum nisi Culpa minim duis labore do laboris occaecat aute sint nisi cupidatat labore magna adipisicing aute. ullamco in sint ipsum elit in. Reprehenderit ullamco consequat minim dolor labore velit ea aute nostrud exercitation. Ad ex irure consectetur excepteur ullamco officia ut nostrud sunt elit anim laborum mollit. Proident nisi in cillum incididunt sit nostrud in quis fugiat officia do veniam pariatur ipsum. Deserunt veniam mollit sint dolore cupidatat culpa then end";

  let isFollowing, toggleFollow, handleDelete;
  if (!isOwner && !miniShort) {
    isFollowing = following.includes(user.id);
    toggleFollow = async () => {
      try {
        if (following) {
          setUpdatingFollowing(true);
          await http.put(
            `/users/${user.id}/${isFollowing ? "unfollow" : "follow"}`
          );
          const prop = {};
          if (isFollowing)
            prop.following = following.filter(id => id !== user.id);
          else prop.following = [user.id, ...following];
          dispatch(updateUser(prop));
          setUpdatingFollowing(false);
        } else setSnackBar();
      } catch (msg) {
        console.log(msg);
      }
    };
  }
  const _handleAction = async (reason, data) => {
    const closeDialog = () => {
      handleAction("update", { id, pause: false });
      setOpenDeleteDialog(false);
    };
    closeDialog();
    switch (reason) {
      case "delete":
        try {
          // console.log(document, "document");
          handleAction("filter", id, true);
          await http.delete(`/shorts/${id}`);
          handleAction("clear-cache");
        } catch (msg) {
          setSnackBar(msg);
          handleAction("new");
        }
        break;
      default:
        break;
    }
  };
  return (
    <>
      <Stack
        sx={{
          position: "absolute",
          width: "100%",
          color: "white",
          bottom: 0,
          p: 1,
          alignItems: "flex-start",
          flexWrap: "wrap",
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
          background: ({
            palette: {
              common: { blend }
            }
          }) => blend
        }}
      >
        {miniShort ? null : (
          <Avatar
            src={user.photoUrl}
            alt={`$${user.username} photo`}
            variant="sm"
          />
        )}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            paddingBottom: miniShort ? "4px" : 0
          }}
        >
          {miniShort ? null : (
            <StyledTypography variant="h5" $maxLine={2}>
              @{user.username}
            </StyledTypography>
          )}
          <StyledTypography
            component="div"
            variant={miniShort ? "caption" : "h6"}
            $maxLine={2}
          >
            {text}
          </StyledTypography>
          <Stack justifyContent="normal" pt="8px">
            {miniShort ? null : isOwner ? (
              <Button
                variant="contained"
                onClick={() => {
                  handleAction("update", { id, pause: true });
                  setOpenDeleteDialog(true);
                }}
              >
                Delete
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={updatingFollowing ? undefined : toggleFollow}
              >
                {updatingFollowing ? (
                  <CircularProgress />
                ) : isFollowing ? (
                  "Unfollow"
                ) : (
                  "Follow"
                )}
              </Button>
            )}
            <Stack flexWrap="wrap">
              <RemoveRedEyeIcon fontSize={miniShort ? "small" : "large"} />
              <Typography variant={miniShort ? "caption" : "h5"}>
                {views}
              </Typography>
            </Stack>
          </Stack>
        </div>
      </Stack>
      <DeleteDialog
        open={openDeleteDialog}
        openFor="delete"
        title="short"
        handleAction={_handleAction}
      />
    </>
  );
};

ShortFooter.propTypes = {};

export default ShortFooter;
