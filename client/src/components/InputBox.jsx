import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
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
  FormControlLabel
} from "@mui/material";
import useForm from "../hooks/useForm";
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
import { Link } from "react-router-dom";
import { useContext } from "../redux/store";
import { useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import http from "../api/http";
import { useTheme } from "@mui/material";
import { removeFileFromFileList } from "utils";
const InputBox = ({ sx, autoFocus = false }) => {
  const { setSnackBar } = useContext();
  const { currentUser } = useSelector(state => state.user);
  const {
    palette: {
      background: { blend }
    }
  } = useTheme();
  const isMd = useMediaQuery("(min-width:576px)");
  const { formData, handleChange, handleSubmit, reset, isSubmitting } = useForm(
    {
      placeholders: {
        text: ""
      },
      required: false,
      returnFormObject: true
    }
  );
  const inputRef = useRef();
  const fileRef = useRef();
  const stateRef = useRef({
    currentSlide: 0,
    visibility: "everyone"
  }).current;

  useEffect(() => {
    autoFocus && inputRef.current.focus();
  }, [autoFocus]);
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
  return (
    <WidgetContainer
      sx={{
        maxHeight: "none",
        ...sx
      }}
    >
      <Stack alignItems="flex-start" gap={2}>
        <Avatar
          variant="md"
          src={currentUser.photoUrl}
          alt={currentUser.username}
        />
        <Box
          sx={{
            flex: 1,
            textarea: {
              width: "100%",
              p: 3,
              m: 0,
              pl: 1,
              border: "none",
              outline: "none"
            }
          }}
        >
          <Select
            defaultValue={stateRef.visibility}
            sx={{
              width: "150px",
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
            onChange={({ target: { value } }) => (stateRef.visibility = value)}
          >
            <MenuItem value="everyone">Everyone</MenuItem>
            <MenuItem value="private">Private</MenuItem>
            <MenuItem value="followers only">Followers only</MenuItem>
          </Select>
          <textarea
            name="text"
            value={formData.text}
            onChange={handleChange}
            placeholder="Tell your story"
            ref={inputRef}
          />
        </Box>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Carousel
        nativeFile
        stateRef={stateRef}
        display={formData.medias ? "block" : "none"}
        actionBar={
          <>
            <IconButton
              sx={{
                color: "common.light",
                background: blend
              }}
              onClick={() => {
                reset({
                  text: formData.text,
                  medias: undefined
                });
              }}
            >
              <CloseIcon />
            </IconButton>
            <IconButton
              sx={{
                color: "common.light",
                background: blend
              }}
              onClick={() => {
                removeFileFromFileList(stateRef.currentSlide, fileRef.current);
                reset({
                  text: formData.text,
                  medias: fileRef.current.files.length && fileRef.current.files
                });
              }}
            >
              <DeleteIcon />
            </IconButton>
          </>
        }
        medias={formData.medias}
      />
      <Stack>
        <input
          multiple
          name="medias"
          ref={fileRef}
          id="input-box-file-dialog"
          type="file"
          accept=".jpg,.jpeg,.png,video/*"
          style={{ display: "none" }}
          onChange={handleChange}
        />
        <Stack>
          <Button
            sx={actionBtnSx}
            component="label"
            htmlFor="input-box-file-dialog"
          >
            <ImageOutlinedIcon />
            <Typography>Image</Typography>
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
        <div>
          <IconButton
            sx={{
              display: isMd ? "none" : "inline-flex"
            }}
          >
            <MoreHorizOutlinedIcon color={"common.mediumMain"} />
          </IconButton>
          <Button
            sx={{
              color: "background.alt",
              backgroundColor: "primary.main",
              borderRadius: 6,
              "&:hover": {
                backgroundColor: "primary.main"
              }
            }}
            onClick={async e => {
              console.log("ons suv");
              const formData = handleSubmit(e);
              if (formData) {
                console.log("handling sub ", formData);
                formData.append("visibility", stateRef.visibility);
                await http.post("/posts/new", formData);
                reset();
                setSnackBar({
                  message: "Your post has been sent!",
                  severity: "success"
                });
              }
            }}
            disabled={isSubmitting || !(formData.text || formData.medias)}
          >
            Post
          </Button>
        </div>
      </Stack>
    </WidgetContainer>
  );
};

InputBox.propTypes = {};

export default InputBox;
