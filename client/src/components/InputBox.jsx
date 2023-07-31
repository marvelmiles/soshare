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
  inputClassName = "",
  docType
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setSnackBar, closeSnackBar } = useContext();
  const currentUser = useSelector(state => state.user.currentUser || {});
  const [moreActionPopover, setMoreActionPopover] = useState({});
  let {
    formData,
    handleChange,
    handleSubmit,
    errors,
    reset,
    isSubmitting,
    setErrors,
    isInValid
  } = useForm({
    placeholders,
    required,
    inputsOnly: submitInputsOnly,
    returnFormObject: true,
    returnFilesArray: true,
    mergeFile: multiple,
    maxUpload,
    maxDuration,
    ignoreMap: {
      document: true
    }
  });
  const [dialog, setDialog] = useState({});
  const mediaCarouselRef = useRef();
  const fileRef = useRef();
  const inputRef = useRef();
  const stateRef = useRef({
    currentSlide: 0,
    visibility: formData.visibility || "everyone",
    filteredMedias: "",
    key: fileId || `input-box-file-dialog-${new Date().getTime()}`,
    inputs: {}
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
                  errors[mediaRefName + "-duration"] &&
                    delete errors[mediaRefName + "-duration"][index];
                  errors[mediaRefName + "-upload"] &&
                    delete errors[mediaRefName + "-upload"][index];
                }
                filtered = undefined;

                !Object.keys(errors[mediaRefName + "-duration"]).length &&
                  delete errors[mediaRefName + "-duration"];

                !Object.keys(errors[mediaRefName + "-upload"]).length &&
                  delete errors[mediaRefName + "-upload"];

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
            formData[mediaRefName].splice(0, 1);
            let deleted;
            setErrors(errors => {
              if (deleted) return errors;
              deleted = true;
              if (errors[mediaRefName + "-duration"])
                delete errors[mediaRefName + "-duration"][currentSlide];
              if (errors[mediaRefName + "-upload"])
                delete errors[mediaRefName + "-upload"][currentSlide];

              Object.keys(errors[mediaRefName + "-duration"]).length &&
                delete errors[mediaRefName + "-duration"];

              !Object.keys(errors[mediaRefName + "-upload"]).length &&
                delete errors[mediaRefName + "-upload"];

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
              key: "settings",
              value:
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
          formData: new FormData()
        });
        if (_formData) {
          console.log(
            _formData.getAll(mediaRefName),
            _formData.get("visibility"),
            _formData.get("text")
          );
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
                ? `Updated ${docType || mediaRefName} successfully!`
                : `Your ${docType || mediaRefName} has been soshared!`,
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
      withPlaceholders,
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
    try {
      const withLimit = !!(
        errors[mediaRefName] ||
        errors[mediaRefName + "-duration"] ||
        errors[mediaRefName + "-upload"]
      );
      const hasErr = withLimit || errors.text;
      if (!stateRef.current.hideErr && hasErr) {
        let msg = "";
        for (const key in errors) {
          msg = errors[key].code
            ? "Invalid file format or browser have no support for it!"
            : errors[key];
          if (msg)
            if (isObject(msg)) {
              for (let index in msg) {
                index = Number(index);
                if (index > -1 && msg[index]) {
                  msg += `${msg.length ? "\n" : ""}${index + 1}) ${
                    msg[index].code
                      ? "Invalid file format or browser have no support for it!"
                      : "Maximum upload or duration limit exceeded!"
                  } ${formData[mediaRefName][index].name}.`;
                }
              }
            } else if (withLimit)
              msg = "Maximum upload or duration limit exceeded!";
        }
        if (withLimit && !formData[mediaRefName]) {
          stateRef.current.hideErr = true;
          closeSnackBar();
          setErrors(errors => {
            delete errors[mediaRefName];
            delete errors[mediaRefName + "-duration"];
            delete errors[mediaRefName + "-upload"];
            return { ...errors };
          });
        }

        if (msg && msg.length) {
          withLimit && (stateRef.current.hideErr = true);
          setSnackBar(msg);
        }
      } else if (!hasErr) stateRef.current.hideErr = undefined;
    } catch (err) {
      console.log(err);
    }
  }, [errors, mediaRefName, setSnackBar, formData, closeSnackBar, setErrors]);

  const disable = isSubmitting || isProcessingDelete;

  const handleDeleteAll = e => {
    e.stopPropagation();
    if (currentUser.settings.hideDelMediasDialog) deleteMedia(true);
    else showDelDialog("delete-temp", true);
  };

  const handleFileTransfer = e => {
    stateRef.current.hideErr = undefined;
    handleChange(e);
  };

  const textareaId = `${stateRef.current.key}-inputbox-textarea`;

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
          mb: 0,
          width: "100%"
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
          <Stack
            alignItems="flex-start"
            justifyContent="flex-start"
            gap={{
              xs: 1,
              s320: 2
            }}
            px={{
              xs: 1,
              s320: 2
            }}
          >
            <Avatar
              variant="sm"
              src={currentUser.photoUrl}
              alt={currentUser.username}
            />
            <Box
              sx={{
                minWidth: "0",
                flex: "1",
                display: "flex",
                flexDirection: "column"
                // width: "150px"
              }}
            >
              <Stack>
                <Select
                  className="Mui-custom-select"
                  value={formData.visibility || "everyone"}
                  sx={{
                    width: "100%",
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
                    stateRef.current.hideErr = true;
                    formData.visibility = value;
                    reset({ ...formData });
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
                <label htmlFor={textareaId}>
                  <Typography
                    ref={inputRef}
                    name="text"
                    autoFocus={autoFocus}
                    value={formData.text || ""}
                    onChange={handleChange}
                    placeholder={placeholder}
                    component="textarea"
                    id={textareaId}
                    sx={{
                      color: "text.primary",
                      fontSize: boldFont ? "20px" : "16px",
                      width: "100%",
                      maxWidth: "100%",
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
                  <Typography
                    sx={{
                      float: "right",
                      pr: 1
                    }}
                  >
                    {(formData.text || "").length || 0} / {max}
                  </Typography>
                </label>
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
            onCarouselChange={setCurrentSlide}
            currentSlide={currentSlide}
            videoPlayerProps={videoPlayerProps}
            actionBar={
              showActionBar ? (
                <>
                  <IconButton disabled={disable} onClick={handleDeleteAll}>
                    <CloseIcon />
                  </IconButton>
                  {multiple ? (
                    <IconButton
                      disabled={disable}
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
          <Stack
            mt={1}
            px={2}
            justifyContent="flex-end"
            flexWrap={{
              xs: "wrap",
              s200: "nowrap"
            }}
          >
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
              onChange={handleFileTransfer}
            />
            <Stack>
              <Button
                component="label"
                sx={{
                  ...actionBtnSx,
                  display: {
                    xs: "none",
                    s200: "inline-flex"
                  },
                  justifyContent: "center",
                  padding: 1
                }}
                htmlFor={stateRef.current.key}
              >
                <ImageOutlinedIcon />
                <Typography>Media</Typography>
              </Button>

              {/* {isSm ? (
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
              ) : null} */}
            </Stack>
            <Stack
              alignItems="flex-start"
              flexWrap="wrap"
              gap="8px"
              justifyContent="center"
            >
              <IconButton
                sx={{
                  display: {
                    xs: "inline-flex",
                    s200: "none"
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
                disabled={disable || isInValid}
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
            // {
            //   icon: GifBoxOutlinedIcon,
            //   title: "Gif"
            // },
            // {
            //   icon: MicOutlinedIcon,
            //   title: "Audio"
            // },
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
