import React, { useState } from "react";
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
  const { id: cid } = useSelector(state => state.user.currentUser || {});
  const { toggleFollow, isProcessingFollow, isFollowing } = useFollowDispatch(
    user
  );
  const { handleDelete } = useDeleteDispatch({
    handleAction
  });
  const isOwner = user.id === cid;
  const _handleAction = async reason => {
    const closeDialog = () => {
      handleAction("update", { id, pause: false });
      setOpenDeleteDialog(false);
    };
    closeDialog();
    switch (reason) {
      case "delete":
        handleDelete(`/shorts`, [id]);
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
          bottom: 0,
          p: 1,
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
            sx={{ backgroundColor: "common.blend" }}
            animation={animation}
          />
        ) : (
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
          {miniShort ? null : loading ? (
            <Skeleton
              variant="text"
              sx={{ fontSize: "1rem", backgroundColor: "common.blend" }}
            />
          ) : (
            <StyledTypography
              variant="h5"
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
              variant={miniShort ? "caption" : "h6"}
              maxLine={2}
            >
              {text}
            </StyledTypography>
          )}

          <Stack justifyContent="normal" pt="8px">
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
                      handleAction("update", { id, pause: true });
                      setOpenDeleteDialog(true);
                    }}
                  >
                    Delete
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={isProcessingFollow ? undefined : toggleFollow}
                  >
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
