import React, { useState, useRef, useCallback, useEffect } from "react";
import propTypes from "prop-types";
import { WidgetContainer } from "components/styled";
import Loading from "components/Loading";
import {
  Stack,
  Avatar,
  Divider,
  Typography,
  Box,
  IconButton,
  Button,
  Select,
  MenuItem,
  Popover,
  List,
  ListItemButton,
  ListItemIcon, // 090392266763 ay from deko
  ListItemText
} from "@mui/material";
import useForm from "hooks/useForm";
import useMediaQuery from "@mui/material/useMediaQuery";
import GifBoxOutlinedIcon from "@mui/icons-material/GifBoxOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import CloseIcon from "@mui/icons-material/Close";
import MediaCarousel from "components/MediaCarousel";
import { useContext } from "context/store";
import { useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import http from "api/http";
import { useTheme } from "@mui/material";
import { useDispatch } from "react-redux";
import { updateUser } from "context/slices/userSlice";
import DeleteDialog from "components/DeleteDialog";
import useDeleteDispatch from "hooks/useDeleteDispatch";

const InputBox = ({
  sx,
  autoFocus = true,
  hideTextArea = false,
  multiple = true,
  mediaRefName = "medias",
  url = "/posts/new",
  accept = "medias",
  showDeleteBtn,
  placeholders,
  handleAction,
  placeholder = "Soshare!",
  showIndicator = true,
  showActionBar = true,
  max = 700,
  videoPlayerProps,
  required,
  actionText,
  message,
  method,
  resetData = true,
  boldFont,
  dialogTitle,
  urls = {},
  maxUpload = "500mb",
  maxDuration = "12h",
  withPlaceholders = true,
  fileId,
  submitInputsOnly,
  docType = "post"
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setSnackBar, setContext } = useContext();
  const currentUser = useSelector(state => state.user.currentUser || {});
  const [moreActionPopover, setMoreActionPopover] = useState({});
  const {
    palette: {
      background: { blend }
    }
  } = useTheme();
  const isSm = useMediaQuery("(min-width:576px)");
  let {
    formData,
    handleChange,
    handleSubmit,
    errors,
    reset,
    isSubmitting,
    stateChanged,
    setErrors
  } = useForm({
    placeholders,
    required,
    inputsOnly: submitInputsOnly,
    returnFormObject: true,
    returnFilesArray: true,
    mergeFile: multiple,
    maxUpload,
    maxDuration
  });
  const [dialog, setDialog] = useState({});
  const mediaCarouselRef = useRef();
  const fileRef = useRef();
  const inputRef = useRef();
  const stateRef = useRef({
    currentSlide: 0,
    visibility: formData.visibility || "everyone",
    filteredMedias: "",
    key: fileId || `input-box-file-dialog-${new Date().getTime()}`
  });
  const dispatch = useDispatch();
  const actionBtnSx = {
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px",
    "& *": {
      color: "primary.main"
    }
  };

  const deleteMedia = useCallback(
    _multiple => {
      if (formData[mediaRefName]) {
        console.log("deleting media ", multiple, dialog.multiple, _multiple);
        const stateCtx = stateRef.current;

        if (multiple) {
          if (dialog.multiple || _multiple) {
            formData[mediaRefName].forEach(m => {
              if (placeholders) {
                stateCtx.filteredMedias += `${
                  stateCtx.filteredMedias.length ? "," : ""
                }${m.id}`;
              }
            });
            formData[mediaRefName] = [];
            setErrors(errors => {
              delete errors[mediaRefName + "-duration"];
              delete errors[mediaRefName + "-upload"];
              return {
                ...errors
              };
            });
          } else {
            if (placeholders)
              stateCtx.filteredMedias += `${
                stateCtx.filteredMedias.length ? "," : ""
              }${formData[mediaRefName][currentSlide].id}`;
            delete formData[mediaRefName].splice(currentSlide, 1);
            setErrors(errors => {
              if (errors[mediaRefName + "-duration"])
                delete errors[mediaRefName + "-duration"][currentSlide];
              if (errors[mediaRefName + "-upload"])
                delete errors[mediaRefName + "-upload"][currentSlide];
              return {
                ...errors
              };
            });
            const slide = currentSlide ? currentSlide - 1 : 0;
            setCurrentSlide(slide);
            mediaCarouselRef.current.goToSlide(slide);
          }
          if (!formData[mediaRefName].length) delete formData[mediaRefName];
        } else {
          delete formData[mediaRefName];
          setErrors(errors => {
            delete errors[mediaRefName + "-duration"];
            delete errors[mediaRefName + "-upload"];
            return {
              ...errors
            };
          });
        }
        if (!formData[mediaRefName]) fileRef.current.value = "";
        reset(
          { ...formData },
          {
            stateChanged: !!formData.text,
            resetErrors: !formData[mediaRefName] && !formData.text
          }
        );
        setDialog(dialog => ({
          ...dialog,
          open: false
        }));
      } else {
        console.log(" no medid ");
      }
    },
    [
      formData,
      mediaRefName,
      placeholders,
      reset,
      dialog?.multiple,
      currentSlide,
      multiple,
      setErrors
    ]
  );

  const showDelDialog = (openFor = "delete", multiple, e) => {
    if (e) e.stopPropagation();
    setDialog({
      open: true,
      openFor,
      multiple,
      title: dialogTitle || multiple ? "medias" : "media"
    });
  };

  const { handleDelete, isProcessingDelete } = useDeleteDispatch({
    handleAction
  });

  const _handleAction = useCallback(
    async (reason, data) => {
      switch (reason) {
        case "delete-temp":
          deleteMedia();
          break;
        case "delete":
          handleDelete(urls.delPath, [placeholders.id]);
          break;
        case "checked":
          dispatch(
            updateUser({
              settings:
                dialog.openFor === "delete"
                  ? {
                      hideDelDialog: true
                    }
                  : {
                      [dialog.multiple
                        ? "hideDelMediasDialog"
                        : "hideDelMediaDialog"]: data
                    }
            })
          );
          break;
        case "close":
          setDialog({
            ...dialog,
            open: false
          });
          break;
        default:
          break;
      }
    },
    [deleteMedia, dialog, dispatch, handleDelete, urls, placeholders]
  );
  const handleDeleteMediaFromDB = e => {
    e && e.stopPropagation();
    if (currentUser.settings.hideDelDialog) _handleAction("delete");
    else showDelDialog("delete", false, e);
  };
  const onSubmit = useCallback(
    async e => {
      try {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        if (!currentUser.id) return setSnackBar();

        const stateCtx = stateRef.current;
        const _formData = handleSubmit();
        console.log(formData);
        if (_formData) {
          let _url =
            url +
            `?filteredMedias=${
              multiple && placeholders ? stateCtx.filteredMedias : ""
            }`;
          handleAction && handleAction("temp-data", formData, _url);
          const file = _formData.get(`${mediaRefName}[0]`);
          const f = _formData.getAll(`${mediaRefName}`);
          console.log(formData, " form ");
          let res = await http[method ? method : placeholders ? "put" : "post"](
            _url,
            _formData
          );
          // console.log(res);
          setSnackBar({
            message:
              message && message.success
                ? message.success
                : placeholders
                ? `Updated ${mediaRefName} successfully!`
                : `Your ${mediaRefName} has been uploaded!`,
            severity: "success"
          });

          if (placeholders && !res[mediaRefName] && res.url) {
            res = {
              ...res,
              [mediaRefName]: {
                id: res.id,
                url: res.url,
                mimetype: res.mimetype
              }
            };
          }

          reset(
            withPlaceholders && placeholders
              ? { ...placeholders, ...res }
              : resetData
              ? undefined
              : placeholders
          );

          if (handleAction)
            handleAction(placeholders ? "update" : "new", { document: res });
          else
            setContext(context => {
              context.composeDoc = {
                docType,
                document,
                reason: placeholders ? "update" : "new"
              };
              return { ...context };
            });
        } else errors[mediaRefName] && setSnackBar(errors[mediaRefName]);
      } catch (msg) {
        msg = message
          ? message.error || msg.message || msg
          : msg.message || msg;
        if (Array.isArray(msg)) {
          let err;
          err = `Failed to upload`;
          for (let i = 0; i < msg.length; i++) {
            err += ` ${msg[i].file.originalname}${
              i === msg.length - 1 ? "." : ","
            }`;
          }
          err += ` make sure all requirements are met or check connectivity`;
          msg = err;
        }
        setSnackBar(msg);
        reset(true, { stateChanged: true });
        handleAction && handleAction("error", msg);
      }
    },
    [
      currentUser.id,
      errors,
      formData,
      handleAction,
      handleSubmit,
      mediaRefName,
      message,
      method,
      multiple,
      placeholders,
      reset,
      resetData,
      setSnackBar,
      url,
      withPlaceholders,
      setContext,
      docType
    ]
  );
  const showMoreTools = ({ currentTarget }) =>
    setMoreActionPopover({
      ...moreActionPopover,
      open: true,
      anchorEl: currentTarget
    });

  const closeMoreActionPopover = e => {
    e.stopPropagation();
    setMoreActionPopover({
      ...moreActionPopover,
      open: false
    });
  };

  useEffect(() => {
    const node = inputRef.current;
    const onKeyDown = e => {
      switch (e.keyCode) {
        case 13:
          if (!e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
          break;
      }
    };
    node.addEventListener("keydown", onKeyDown, false);
    return () => {
      node.removeEventListener("keydown", onKeyDown, false);
    };
  }, [onSubmit, url]);

  useEffect(() => {
    handleAction &&
      handleAction("context", {
        processing: isSubmitting
          ? placeholders
            ? "updating"
            : "uploading"
          : undefined
      });
  }, [isSubmitting, handleAction, placeholders]);

  useEffect(() => {
    const err =
      errors[mediaRefName] ||
      errors[mediaRefName + "-duration"] ||
      errors[mediaRefName + "-upload"];
    if (err) {
      if (err.code)
        setSnackBar(
          `We're sorry to inform you that we were unable to preview your file due to an issue with the network or the file itself. It appears that the file may be corrupted or damaged or your browser have no support for it!`
        );
      else setSnackBar(`Maximum duration or upload size exceeded!`);
    }
  }, [errors, mediaRefName, setSnackBar]);

  const disabled = isSubmitting || isProcessingDelete;

  const handleDeleteAll = e => {
    e.stopPropagation();
    if (currentUser.settings.hideDelMediasDialog) deleteMedia(true);
    else showDelDialog("delete-temp", true);
  };

  return (
    <>
      <WidgetContainer
        key={stateRef.current.key}
        sx={{
          px: 0,
          ...sx,
          overflowX: isSubmitting ? "hidden" : "auto",
          maxHeight: "none",
          minHeight: "0",
          backgroundColor: "transparent",
          borderBottom: "1px solid #333",
          borderBottomColor: "divider",
          borderRadius: 0,
          mb: 0
        }}
      >
        {disabled ? (
          <div
            style={{
              position: "absolute",
              zIndex: 1,
              width: "100%",
              height: "calc(100% - 16px)"
            }}
          ></div>
        ) : null}
        <form onSubmit={onSubmit}>
          <Stack alignItems="flex-start" gap={2} px={2}>
            <Avatar
              variant="sm"
              src={currentUser.photoUrl}
              alt={currentUser.username}
            />
            <Box
              sx={{
                flex: 1,
                textarea: {
                  width: "100%",
                  p: 1,
                  pt: 2,
                  m: 0,
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent"
                }
              }}
            >
              <Stack
                sx={{
                  minWidth: "0",
                  width: "150px"
                }}
              >
                <Select
                  className="Mui-custom-select"
                  value={formData.visibility || "everyone"}
                  sx={{
                    width: "90%",
                    maxWidth: "150px",
                    marginInline: "auto",
                    borderRadius: 24,
                    p: 0,
                    m: 0,
                    // flex: 1,
                    color: "primary.main",
                    "&:hover,&:focus": {
                      background: "none"
                    },
                    "& .MuiSvgIcon-root": {
                      pr: "0.25rem",
                      fontSize: "32px",
                      color: "primary.main"
                    },
                    "& .MuiInputBase-input": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textTransform: "capitalize",
                      p: 1
                    },
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main"
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main"
                    }
                  }}
                  onChange={({ target: { value } }) => {
                    formData.visibility = value;
                    reset(formData, { stateChanged: true });
                  }}
                >
                  <MenuItem value="everyone">Everyone</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="followers only">Followers only</MenuItem>
                </Select>
                {isSubmitting ? (
                  <Loading
                    sx={{
                      minHeight: "none",
                      height: "auto",
                      p: 0,
                      width: "auto",
                      minWidth: 0
                    }}
                  />
                ) : null}
              </Stack>
              {hideTextArea ? null : (
                <div>
                  <Typography
                    ref={inputRef}
                    name="text"
                    autoFocus={autoFocus}
                    value={formData.text || ""}
                    onChange={handleChange}
                    placeholder={placeholder}
                    component="textarea"
                    sx={{
                      color: "primary.contrastText",
                      fontSize: boldFont ? "24px" : "16px",
                      "&::placeholder": {
                        color: "primary.contrastText"
                      }
                    }}
                    data-max={max}
                  />
                  <Typography style={{ float: "right" }}>
                    {(formData.text || "").length || 0} / {max}
                  </Typography>
                </div>
              )}
            </Box>
          </Stack>
          {hideTextArea ? null : <Divider sx={{ my: 1 }} />}
          <MediaCarousel
            medias={
              multiple
                ? formData[mediaRefName]
                : formData[mediaRefName] && [formData[mediaRefName]]
            }
            showIndicator={multiple && showIndicator}
            ref={mediaCarouselRef}
            beforeChange={setCurrentSlide}
            currentSlide={currentSlide}
            videoPlayerProps={videoPlayerProps}
            actionBar={
              showActionBar ? (
                <>
                  <IconButton
                    disabled={disabled}
                    sx={{
                      color: "common.light",
                      background: blend
                    }}
                    onClick={handleDeleteAll}
                  >
                    <CloseIcon />
                  </IconButton>
                  {multiple ? (
                    <IconButton
                      disabled={disabled}
                      sx={{
                        color: "common.light",
                        background: blend
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        if (currentUser.settings.hideDelMediaDialog)
                          deleteMedia();
                        else showDelDialog("delete-temp");
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  ) : null}
                </>
              ) : (
                undefined
              )
            }
          />
          <Stack mt={1} px={2}>
            <input
              multiple={multiple}
              name={mediaRefName}
              ref={fileRef}
              id={stateRef.current.key}
              type="file"
              accept={
                {
                  video: "video/*",
                  medias: ".jpg,.jpeg,.png,video/*"
                }[accept] || accept
              }
              style={{ display: "none" }}
              onChange={handleChange}
            />
            <Stack>
              <Button
                component="label"
                sx={{
                  ...actionBtnSx,
                  display: {
                    xs: "none",
                    s280: "inline-flex"
                  }
                }}
                htmlFor={stateRef.current.key}
              >
                <ImageOutlinedIcon />
                <Typography>Media</Typography>
              </Button>

              {isSm ? (
                <>
                  <Button sx={actionBtnSx}>
                    <GifBoxOutlinedIcon />
                    <Typography>Gif</Typography>
                  </Button>
                  <Button sx={actionBtnSx}>
                    <MicOutlinedIcon />
                    <Typography>Audio</Typography>
                  </Button>
                </>
              ) : null}
            </Stack>
            <Stack
              alignItems="flex-start"
              flexWrap="wrap"
              gap="8px"
              justifyContent="center"
            >
              <IconButton
                sx={{
                  display: isSm ? "none" : "inline-flex",
                  [`&:focus,&:active`]: {
                    backgroundColor: "background.alt"
                  }
                }}
                onClick={showMoreTools}
              >
                <MoreHorizOutlinedIcon color={"common.mediumMain"} />
              </IconButton>
              {showDeleteBtn ? (
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: 6,
                    mx: 1,
                    display: {
                      xs: "none",
                      sm: "inlne-flex"
                    }
                  }}
                  onClick={handleDeleteMediaFromDB}
                  disabled={disabled}
                >
                  Delete
                </Button>
              ) : null}

              <Button
                sx={{
                  borderRadius: 6
                }}
                type="submit"
                disabled={disabled || !stateChanged}
                variant="contained"
              >
                {actionText ? actionText : placeholders ? "Update" : "Soshare"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </WidgetContainer>
      <DeleteDialog {...dialog} handleAction={_handleAction} />

      <Popover {...moreActionPopover} onClose={closeMoreActionPopover}>
        <List>
          {[
            {
              icon: ImageOutlinedIcon,
              title: "Media",
              htmlFor: stateRef.current.key,
              component: "label",
              display: {
                xs: "flex",
                s280: "none"
              }
            },
            {
              icon: GifBoxOutlinedIcon,
              title: "Gif"
            },
            {
              icon: MicOutlinedIcon,
              title: "Audio"
            },
            {
              icon: DeleteIcon,
              title: "Delete",
              onClick: handleDeleteMediaFromDB,
              nullify: !showDeleteBtn
            }
          ].map((l, i) =>
            l.nullify ? null : (
              <ListItemButton
                disabled={disabled}
                onClick={e => {
                  closeMoreActionPopover(e);
                  l.onClick && l.onClick();
                }}
                component={l.component || "li"}
                key={i}
                htmlFor={l.htmlFor || undefined}
                sx={{
                  borderBottom: "1px solid currentColor",
                  borderColor: "divider",
                  p: 2,
                  display: l.display
                }}
              >
                <ListItemIcon>
                  <l.icon />
                </ListItemIcon>
                <ListItemText
                  primary={l.title}
                  sx={{ textTransform: "capitalize" }}
                />
              </ListItemButton>
            )
          )}
        </List>
      </Popover>
    </>
  );
};

InputBox.propTypes = {};

export default InputBox;
