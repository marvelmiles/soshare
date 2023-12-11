import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import { StyledTypography } from "../styled";
import { Typography, Avatar, Button, CircularProgress } from "@mui/material";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { useSelector } from "react-redux";
import DeleteDialog from "components/DeleteDialog";
import useFollowDispatch from "hooks/useFollowDispatch";
import useDeleteDispatch from "hooks/useDeleteDispatch";
import Skeleton from "@mui/material/Skeleton";
import { Link } from "react-router-dom";

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
  id,
  handleAction,
  loading,
  animation
}) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const {
    id: cid,
    settings: { hideDelDialog }
  } = useSelector(state => state.user.currentUser);
  const {
    handleToggleFollow,
    isProcessingFollow,
    isFollowing
  } = useFollowDispatch({
    user,
    docId: id
  });

  const { handleDelete } = useDeleteDispatch({
    handleAction
  });

  const isOwner = user?.id === cid;

  const _handleAction = useCallback(
    (reason, options) => {
      if (reason === "mounted") return;
      const closeDialog = () => {
        const taskId = setTimeout(() => {
          handleAction("update", { document: { id, pause: false } });
          clearTimeout(taskId);
        }, 0);
        setOpenDeleteDialog(false);
      };
      switch (reason) {
        case "delete":
          handleDelete(`/shorts`, [id], { label: "short" });
          closeDialog();
          break;
        case "close":
          closeDialog();
          break;
        default:
          handleAction && handleAction(reason, options);
          break;
      }
    },
    [handleAction, handleDelete, id]
  );

  return (
    <>
      <Stack
        sx={{
          position: "absolute",
          width: "100%",
          bottom: "0",
          p: miniShort ? "4px" : 1,
          alignItems: "flex-start",
          flexWrap: "wrap",
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
          backgroundColor: "common.blend",
          "*": {
            color: "common.white"
          }
        }}
      >
        {miniShort ? null : loading ? (
          <Skeleton
            variant="circular"
            width={30}
            height={30}
            animation={animation}
          />
        ) : (
          <Avatar
            src={user.photoUrl}
            alt={`${user.username} photo`}
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
          {miniShort ? null : loading ? (
            <Skeleton
              variant="text"
              sx={{ fontSize: "1rem", backgroundColor: "common.blend" }}
            />
          ) : (
            <StyledTypography
              variant="caption"
              maxLine={2}
              component={Link}
              onClick={e => e.stopPropagation()}
              to={`/u/${user.id}`}
              color="inherit"
            >
              @{user.username}
            </StyledTypography>
          )}
          {loading ? (
            <Skeleton
              variant="text"
              sx={{ fontSize: "1rem", backgroundColor: "common.blend" }}
            />
          ) : (
            <StyledTypography
              component="div"
              variant="caption"
              className="textarea-readOnly"
              textEllipsis={miniShort}
            >
              {text}
            </StyledTypography>
          )}

          <Stack justifyContent="normal" pt="2px">
            {loading ? (
              <Skeleton
                variant="text"
                sx={{
                  fontSize: "1rem",
                  backgroundColor: "common.blend",
                  flex: 1
                }}
              />
            ) : (
              <>
                {miniShort ? null : isOwner ? (
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleAction("update", { document: { id, pause: true } });

                      hideDelDialog
                        ? _handleAction("delete")
                        : setOpenDeleteDialog(true);
                    }}
                  >
                    Delete
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleToggleFollow}>
                    {isProcessingFollow ? (
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
              </>
            )}
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
