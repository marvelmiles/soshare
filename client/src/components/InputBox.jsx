import React from "react";
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
  Button
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
const InputBox = props => {
  const isMd = useMediaQuery("(min-width:576px)");
  const { formData, handleChange, handleSubmit, isSubmitting } = useForm({
    returnFormObject: true
  });
  return (
    <WidgetContainer>
      <Stack>
        <Avatar variant="md" />
        <InputBase
          name="post"
          value={formData.post}
          onChange={handleChange}
          sx={{
            width: "100%",
            backgroundColor: "common.light",
            borderRadius: 4,
            px: 2,
            py: 1
          }}
        />
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
          <Stack flexWrap="wrap">
            <ImageOutlinedIcon sx={{ color: "common.main" }} />
            <Typography
              color="common.mediumMain"
              sx={{ "&:hover": { cursor: "pointer", color: "common.medium" } }}
            >
              Image
            </Typography>
          </Stack>

          {isMd ? (
            <>
              <Stack>
                <GifBoxOutlinedIcon sx={{ color: "common.main" }} />
                <Typography color="common.mediumMain">Gif</Typography>
              </Stack>
              <Stack>
                <AttachFileOutlinedIcon sx={{ color: "common.main" }} />
                <Typography color="common.mediumMain">Attachment</Typography>
              </Stack>
              <Stack>
                <MicOutlinedIcon sx={{ color: "common.main" }} />
                <Typography color="common.mediumMain">Audio</Typography>
              </Stack>
            </>
          ) : null}
        </Stack>
        <div>
          <IconButton
            sx={{
              display: isMd ? "none" : "inline-flex"
            }}
          >
            <MoreHorizOutlinedIcon sx={"common.mediumMain"} />
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
