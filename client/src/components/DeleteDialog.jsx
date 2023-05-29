import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Button,
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
  title = "medias",
  label,
  handleAction
}) => {
  const [deleting, setDeleting] = useState(false);
  const styles = {
    actions: {
      px: "16px !important"
    },
    icon: {
      mr: "8px"
    },
    content: { pt: "18px !important", pb: 0, width: "100%" }
  };
  // useEffect(() => {
  //   handleAction("mounted", { open, type: "delete-dialog" });
  //   open === false && setDeleting(false);
  // }, [handleAction, open]);
  return (
    <Dialog
      open={open}
      onClose={e => {
        console.log(" closed... ");
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
                sx={styles.content}
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                Permanently delete {label || title}? You can't undo this
              </DialogContent>
              <DialogActions
                sx={styles.actions}
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      sx={styles.icon}
                      onChange={(_, bool) => handleAction("checked", bool)}
                    />
                  }
                  label="Don't show again"
                />
                <Button
                  variant="outlined"
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
              <DialogContent sx={styles.content}>
                Temporarily remove {label || title} from screen.
              </DialogContent>
              <DialogActions sx={styles.actions}>
                <FormControlLabel
                  control={
                    <Checkbox
                      sx={styles.icon}
                      onChange={(_, bool) => handleAction("checked", bool)}
                    />
                  }
                  label="Don't show again"
                />
                <Button
                  variant="outlined"
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
