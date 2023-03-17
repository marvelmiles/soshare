import React, { useState, useRef } from "react";
import propTypes from "prop-types";
import { WidgetContainer } from "./styled";
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
  Checkbox
} from "@mui/material";
import useForm, { isFileList } from "../hooks/useForm";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import useMediaQuery from "@mui/material/useMediaQuery";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import GifBoxOutlinedIcon from "@mui/icons-material/GifBoxOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import CloseIcon from "@mui/icons-material/Close";
import Carousel from "./Carousel";
import { useNavigate } from "react-router-dom";
import { useContext } from "../redux/store";
import { useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import http from "../api/http";
import { useTheme } from "@mui/material";
import { removeFileFromFileList } from "utils";
import { v4 as uniq } from "uuid";
import { useDispatch } from "react-redux";
import { updateUser } from "redux/userSlice";
import DeleteDialog from "components/DeleteDialog";

const InputBox = ({
  sx,
  autoFocus = false,
  hideTextArea = false,
  multiple = true,
  mediaRefName = "medias",
  url = "/posts/new",
  accept = "medias",
  showDeleteBtn,
  placeholders,
  handleAction,
  placeholder = "Tell your story",
  showIndicator = true,
  showActionBar = true,
  max = 700,
  videoPlayerProps,
  required,
  actionText,
  message,
  method,
  resetData = true,
  withPlaceholders
}) => {
  const { setSnackBar } = useContext();
  const { currentUser } = useSelector(state => state.user);
  const {
    palette: {
      background: { blend }
    }
  } = useTheme();
  const isMd = useMediaQuery("(min-width:576px)");
  let {
    formData,
    handleChange,
    handleSubmit,
    errors,
    reset,
    isSubmitting,
    stateChanged
  } = useForm({
    placeholders,
    required,
    returnFormObject: true,
    returnFilesArray: true,
    mergeFile: multiple,
    formAppendMap: {
      [mediaRefName]: multiple
    }
  });
  const [dialog, setDialog] = useState({});
  const navigate = useNavigate();
  const mediaCarouselRef = useRef();
  const fileRef = useRef();
  const stateRef = useRef({
    currentSlide: 0,
    visibility: formData.visibility || "everyone",
    excludeMedias: [],
    key: `input-box-file-dialog-${new Date().getTime()}`
  }).current;

  const dispatch = useDispatch();
  const actionBtnSx = {
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 1,
    "&:hover": {
      backgroundColor: "none"
    },
    color: "common.mediumMain",
    "&:hover": {
      color: "common.medium"
    }
  };
  const closeDialogAndReset = () => {
    if (!formData[mediaRefName])
      reset(formData, { stateChanged: !!formData.text });
    setDialog({
      ...dialog,
      open: false
    });
  };
  const deleteMedia = () => {
    if (multiple) {
      const media = formData[mediaRefName][stateRef.currentSlide];
      // console.log(
      //   isFileList(formData[mediaRefName]),
      //   formData[mediaRefName],
      //   stateRef.currentSlide,
      //   !!media
      // );
      formData[mediaRefName] = formData[mediaRefName].filter((m, i) => {
        if (i === stateRef.currentSlide) {
          if (stateRef.currentSlide) {
            stateRef.currentSlide = i - 1;
            mediaCarouselRef.current.goToSlide(stateRef.currentSlide);
          }
          m.id && placeholders && stateRef.excludeMedias.push(m.id);
          return false;
        }
        return true;
      });
      if (!formData[mediaRefName].length) delete formData[mediaRefName];
    } else delete formData[mediaRefName];
    closeDialogAndReset();
  };

  const deleteMedias = () => {
    // console.log(formData[mediaRefName]);
    formData[mediaRefName].forEach(m => stateRef.excludeMedias.push(m.id));
    delete formData[mediaRefName];
    closeDialogAndReset();
  };

  const showDeleteDialog = ({ currentTarget }) =>
    setDialog({
      open: true,
      for: "delete-post",
      anchorEl: currentTarget
    });
  const onSubmit = async e => {
    try {
      e.stopPropagation();
      e.preventDefault();
      const _formData = handleSubmit(e);
      // return (
      //   _formData &&
      //   console.log(
      //     "is submitng media ",
      //     _formData.getAll(mediaRefName),
      //     stateRef.excludeMedias,
      //     formData.visibility,
      //     formData,
      //     _formData.get("document")
      //   )
      // );

      if (_formData) {
        multiple &&
          placeholders &&
          _formData.append("excludeMedias", stateRef.excludeMedias);
        handleAction && handleAction("temp-data", formData);
        console.log("submitting");
        let res = await http[method ? method : placeholders ? "put" : "post"](
          url,
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
          resetData && withPlaceholders === undefined
            ? undefined
            : withPlaceholders
            ? placeholders
            : res
        );
        handleAction && handleAction("new", res);
      } else errors[mediaRefName] && setSnackBar(errors[mediaRefName]);
    } catch (msg) {
      console.log("has input box error ");
      reset(true);
      setSnackBar(message ? message.error || msg : msg);
      handleAction && handleAction("failed", msg);
    }
  };
  const _handleAction = async (reason, data) => {
    switch (reason) {
      case "delete-temp":
        dialog.multiple ? deleteMedias() : deleteMedia();
        break;
      case "delete":
        await http.delete(`/posts/${placeholders.id}`);
        navigate("/u/profile?d=user-posts");
      case "checked":
        dispatch(
          updateUser(
            dialog.multiple
              ? {
                  hideDelMediasDialog: data
                }
              : {
                  hideDelMediaDialog: data
                }
          )
        );
        break;
      default:
        setDialog({
          ...dialog,
          open: false
        });
        break;
    }
  };
  return (
    <>
      <WidgetContainer
        key={stateRef.key}
        sx={{
          px: 0,
          ...sx,
          overflowX: isSubmitting ? "hidden" : "auto",
          maxHeight: "none",
          minHeight: "0",
          backgroundColor: "transparent",
          borderBottom: "1px solid #333",
          borderBottomColor: "divider",
          borderRadius: 0
          // border: "1px solid red"
        }}
      >
        {isSubmitting ? (
          <div
            style={{
              position: "absolute",
              zIndex: 1,
              width: "100%",
              height: "100%"
              // border: "10px solid red"
            }}
          />
        ) : null}
        <form onSubmit={onSubmit} style={{ border: "1k" }}>
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
                  outline: "none"
                }
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
                  borderColor: "primary.main",
                  "& *": {
                    border: "none !important"
                  },
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
                  }
                }}
                onChange={({ target: { value } }) => {
                  formData.visibility = value;
                  reset(formData);
                }}
              >
                <MenuItem value="everyone">Everyone</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="followers">Followers only</MenuItem>
              </Select>
              {hideTextArea ? null : (
                <div>
                  <textarea
                    name="text"
                    autoFocus={autoFocus}
                    value={formData.text || ""}
                    onChange={e => {
                      if (e.currentTarget.value.length <= max) handleChange(e);
                    }}
                    placeholder={placeholder}
                  />
                  <div style={{ float: "right" }}>
                    {formData.text?.length || 0} / {max}
                  </div>
                </div>
              )}
            </Box>
          </Stack>
          {hideTextArea ? null : <Divider sx={{ my: 1 }} />}
          {(multiple ? (
            formData[mediaRefName]?.length
          ) : (
            formData[mediaRefName]
          )) ? (
            <Carousel
              showIndicator={multiple && showIndicator}
              ref={mediaCarouselRef}
              stateRef={stateRef}
              videoPlayerProps={videoPlayerProps}
              actionBar={
                showActionBar ? (
                  <>
                    <IconButton
                      sx={{
                        color: "common.light",
                        background: blend
                      }}
                      onClick={
                        currentUser.hideDelMediasDialog
                          ? multiple
                            ? deleteMedias
                            : deleteMedia
                          : () =>
                              setDialog({
                                ...dialog,
                                multiple,
                                open: true,
                                openFor: "delete-temp",
                                title: formData[mediaRefName].name
                              })
                      }
                    >
                      <CloseIcon />
                    </IconButton>
                    {multiple ? (
                      <IconButton
                        sx={{
                          color: "common.light",
                          background: blend
                        }}
                        onClick={
                          currentUser.hideDelMediaDialog
                            ? deleteMedia
                            : () => {
                                const media = multiple
                                  ? formData[mediaRefName][
                                      stateRef.currentSlide
                                    ]
                                  : formData[mediaRefName];
                                setDialog({
                                  open: true,
                                  openFor: "delete-temp",
                                  title: media.name
                                });
                              }
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    ) : null}
                  </>
                ) : (
                  undefined
                )
              }
              medias={
                multiple ? formData[mediaRefName] : [formData[mediaRefName]]
              }
            />
          ) : null}
          <Stack mt={1} px={2}>
            <input
              multiple={multiple}
              name={mediaRefName}
              ref={fileRef}
              id={stateRef.key}
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
              <Button sx={actionBtnSx} component="label" htmlFor={stateRef.key}>
                <ImageOutlinedIcon />
                <Typography>Media</Typography>
              </Button>

              {isMd ? (
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
              justifyContent="center"
            >
              <IconButton
                sx={{
                  display: isMd ? "none" : "inline-flex"
                }}
              >
                <MoreHorizOutlinedIcon color={"common.mediumMain"} />
              </IconButton>
              {showDeleteBtn ? (
                <Button
                  variant="contained"
                  sx={{
                    color: "background.alt",
                    backgroundColor: "primary.main",
                    borderRadius: 6,
                    "&:hover": {
                      backgroundColor: "primary.main"
                    },
                    mx: 1,
                    display: {
                      xs: "none",
                      sm: "inlne-flex"
                    }
                  }}
                  onClick={showDeleteDialog}
                >
                  Delete
                </Button>
              ) : null}
              <Button
                sx={{
                  color: "background.alt",
                  backgroundColor: "primary.main",
                  borderRadius: 6,
                  "&:hover": {
                    backgroundColor: "primary.main"
                  }
                }}
                type="submit"
                disabled={isSubmitting || !stateChanged}
              >
                {actionText ? actionText : placeholders ? "Update" : "Post"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </WidgetContainer>
      <DeleteDialog {...dialog} handleAction={_handleAction} />
    </>
  );
};

InputBox.formDataTypes = {};

export default InputBox;
