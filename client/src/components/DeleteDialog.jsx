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
  CircularProgress,
  useMediaQuery
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
  handleAction,
  action = "hideDelDialog"
}) => {
  const [deleting, setDeleting] = useState(false);

  const isS280 = useMediaQuery("(min-width:280px)");

  const styles = {
    actions: {
      px: "16px !important",
      ...(isS280
        ? undefined
        : {
            display: {
              xs: "flex"
            },
            flexWrap: "wrap-reverse",
            ".MuiButton-root": {
              m: 0,
              my: 1
            },
            "& > *": {
              width: "100%"
            }
          })
    },
    icon: {
      mr: "8px"
    },
    content: {
      pt: "14px !important",
      pb: 0,
      width: "100%"
    }
  };
  useEffect(() => {
    open === false && setDeleting(false);
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={e => {
        e.stopPropagation();
        !deleting && handleAction("close");
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
                      onChange={(e, bool) =>
                        e.stopPropagation() ||
                        handleAction("checked", {
                          action,
                          value: bool
                        })
                      }
                    />
                  }
                  label="Don't show again"
                />
                <Button
                  variant="outlined"
                  disabled={deleting}
                  onClick={() => handleAction("close")}
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
                    handleAction("close");
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
