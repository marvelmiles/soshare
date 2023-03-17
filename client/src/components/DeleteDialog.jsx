import React, { useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Stack,
  Avatar,
  InputBase,
  Divider,
  Typography,
  Box,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from "@mui/material";
Dialog.defaultProps = {
  open: false
};
CircularProgress.defaultProps = {
  size: 20,
  sx: {
    color: "primary.dark"
  }
};

const DeleteDialog = ({
  open,
  openFor,
  type,
  title = "medias",
  label,
  handleAction
}) => {
  const [deleting, setDeleting] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={e => {
        e.stopPropagation();
        !deleting && handleAction("cancel");
      }}
    >
      {
        {
          delete: (
            <>
              <DialogTitle>Delete {title}</DialogTitle>
              <DialogContent
                sx={{ width: "100%" }}
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                Permanently delete {label || title}? You can't undo this
              </DialogContent>
              <DialogActions
                sx={
                  {
                    // p:
                  }
                }
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                <Button
                  disabled={deleting}
                  onClick={() => handleAction("cancel")}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={e => {
                    e.stopPropagation();
                    if (!deleting) {
                      setDeleting(true);
                      handleAction("delete");
                    }
                  }}
                >
                  {deleting ? <CircularProgress /> : "Delete"}
                </Button>
              </DialogActions>
            </>
          ),
          "delete-temp": (
            <>
              <DialogTitle>Delete {title}?</DialogTitle>
              <DialogContent>
                Temporarily remove {label || title} from screen.
              </DialogContent>
              <DialogActions justifyContent="space-between">
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={(_, bool) => handleAction("checked", bool)}
                    />
                  }
                  label="Don't show again"
                />
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    handleAction("cancel");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={e => {
                    e.stopPropagation();
                    handleAction("delete-temp");
                  }}
                >
                  Delete
                </Button>
              </DialogActions>
            </>
          )
        }[openFor]
      }
    </Dialog>
  );
};

DeleteDialog.propTypes = {};

export default DeleteDialog;
