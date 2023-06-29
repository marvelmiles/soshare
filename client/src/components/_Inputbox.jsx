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
  ListItemIcon,
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
import { isObject } from "utils/validators";
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
  maxUpload = "1gb",
  maxDuration = "5h",
  withPlaceholders = true,
  fileId,
  submitInputsOnly,
  inputClassName = ""
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setSnackBar, closeSnackBar } = useContext();
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
        const stateCtx = stateRef.current;

        if (multiple) {
          if (dialog.multiple || _multiple) {
            let filtered = {};
            formData[mediaRefName].forEach((m, i) => {
              if (placeholders) {
                stateCtx.filteredMedias += `${
                  stateCtx.filteredMedias.length ? "," : ""
                }${m.id}`;
                filtered[i] = true;
              }
            });
            formData[mediaRefName] = [];
            setErrors(errors => {
              if (filtered) {
                for (const index in filtered) {
                  delete errors[mediaRefName + "-duration"][index];
                  delete errors[mediaRefName + "-upload"][index];
                }
                filtered = undefined;
                return {
                  ...errors
                };
              } else return errors;
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
        if (!currentUser.id) {
          const docId =
            placeholders && (placeholders.document.id || placeholders.document);
          return setSnackBar(undefined, docId && { [docId]: formData });
        }
        const stateCtx = stateRef.current;
        const _formData = handleSubmit(undefined, {
          formData: new FormData(),
          bareMessage: true
        });
        return console.log(_formData.getAll(mediaRefName));
        if (_formData) {
          let _url =
            url +
            `?filteredMedias=${
              multiple && placeholders ? stateCtx.filteredMedias : ""
            }`;
          handleAction && handleAction("temp-data", formData, _url);
          let res = await http[method ? method : placeholders ? "put" : "post"](
            _url,
            _formData
          );
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
        }
      } catch (msg) {
        msg = message ? message.error || msg : msg;
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
        msg && setSnackBar(msg);
        reset(true, { stateChanged: true });
        handleAction && handleAction("error", msg);
      }
    },
    [
      currentUser.id,
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
      withPlaceholders
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
    try {
      let withLimit = !!(
        errors[mediaRefName + "-duration"] || errors[mediaRefName + "-upload"]
      );
      let err =
        errors[mediaRefName + "-duration"] || errors[mediaRefName + "-upload"];

      let msg = "";
      console.log("has er ", err, errors);
      if (err) {
        console.log("has errrrrrr ");
        if (isObject(err)) {
          err = withLimit
            ? {
                ...errors[mediaRefName + "-duration"],
                ...errors[mediaRefName + "-upload"]
              }
            : err;
          console.log(Object.keys(err).length, " poo ");
          if (Object.keys(err).length > 0 && formData[mediaRefName]) {
            for (const key in err) {
              msg += `${msg.length ? "\n" : ""}${Number(key) + 1}) ${
                err[key].code
                  ? "Invalid file format or browser have no support for it."
                  : withLimit
                  ? `Maximum upload or duration limit exceeded for`
                  : err[key]
              } ${formData[mediaRefName][key].name}`;
            }
          } else {
            setErrors(errors => {
              delete errors[mediaRefName];
              delete errors[mediaRefName + "-duration"];
              delete errors[mediaRefName + "-upload"];
              return { ...errors };
            });
          }
        } else if (typeof err === "string" || withLimit)
          msg = withLimit ? "Maximum upload or duration limit exceeded!" : err;
      
      }

      msg && setSnackBar(msg);
    } catch (err) {
      console.log(err);
    }
  }, [errors, mediaRefName, setSnackBar, formData, setErrors, closeSnackBar]);

  const disable = isSubmitting || isProcessingDelete;

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
        {disable ? (
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
                flex: 1
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
                    reset({ ...formData }, { stateChanged: true });
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
                      color: "text.primary",
                      fontSize: boldFont ? "20px" : "16px",
                      width: "100%",
                      m: 0,
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      minHeight: "60px",
                      maxHeight: "60px",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      mt: 1,
                      "&::placeholder": {
                        color: "text.secondary"
                      }
                    }}
                    data-max={max}
                    className={`inputbox-textarea ${inputClassName}`}
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
                    disabled={disable}
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
                      disabled={disable}
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
                  disabled={disable}
                >
                  Delete
                </Button>
              ) : null}

              <Button
                sx={{
                  borderRadius: 6
                }}
                type="submit"
                disabled={
                  disable ||
                  (Object.keys(errors).length > 0 ||
                    Object.keys(formData).length < 1 ||
                    (required && required !== true
                      ? (() => {
                          let withErr;
                          for (const key in required) {
                            if (!formData[key]) {
                              withErr = true;
                              break;
                            }
                          }
                          return withErr;
                        })()
                      : false))
                }
                variant="contained"
              >
                {actionText
                  ? actionText
                  : method === "put"
                  ? "Update"
                  : "Soshare"}
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
                disabled={disable}
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
  