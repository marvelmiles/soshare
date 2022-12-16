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
const InputBox = ({ sx, autoFocus = false }) => {
  const isMd = useMediaQuery("(min-width:576px)");
  const { formData, handleChange, handleSubmit, isSubmitting } = useForm({
    returnFormObject: true
  });
  const inputRef = useRef();
  useEffect(() => {
    autoFocus && inputRef.current.focus();
  }, [autoFocus]);
  const actionBtnSx = {
    justifyContent: "center",
    flexWrap: "wrap",
    "&:hover": {
      backgroundColor: "none"
    },
    color: "common.mediumMain",
    "&:hover": {
      color: "common.medium"
    }
  };

  return (
    <WidgetContainer sx={sx}>
      <Stack alignItems="flex-start" gap={2}>
        <Avatar variant="md" />
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
            value={"public"}
            sx={{
              width: "150px",
              marginInline: "auto",
              borderRadius: 24,
              p: 0,
              m: 0,
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover,&:focus": {
                background: "none"
              },
              "& .MuiSvgIcon-root": {
                pr: "0.25rem",
                fontSize: "32px",
                color: "primary.main"
              },
              "& .MuiTypography-root": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                ml: 1
              }
            }}
            onChange={(...props) => console.log(props)}
            input={<InputBase />}
          >
            <MenuItem value="public">
              <Typography>Public</Typography>
            </MenuItem>
            <MenuItem component={Link} to="/auth/signin">
              Private
            </MenuItem>
          </Select>
          <textarea
            name="post"
            value={formData.post}
            onChange={handleChange}
            placeholder="Tell your story"
            ref={inputRef}
          />
        </Box>
      </Stack>
      <Divider sx={{ my: 2 }} />

      <div style={{ position: "relative", margin: "16px 0" }}>
        <IconButton
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "common.main",
            color: "common.light",
            zIndex: 1
          }}
        >
          <CloseIcon />
        </IconButton>
        <Carousel />
      </div>
      <Stack>
        <Stack>
          <Button sx={actionBtnSx}>
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
                <AttachFileOutlinedIcon />
                <Typography>Attachment</Typography>
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
