import React, { useState } from "react";
import PropTypes from "prop-types";
import { WidgetContainer, Image } from "./styled";
import Box from "@mui/material/Box";
import DragDropArea from "./DragDropArea";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import InputBase from "@mui/material/InputBase";
import PersonIcon from "@mui/icons-material/Person";

const UserProfileForm = ({ width }) => {
  const [image, setImage] = useState(null);
  const fluidSize = {
    width: "150px"
  };
  return (
    <WidgetContainer
      sx={{
        width
      }}
    >
      <Box
        sx={{
          ...fluidSize,
          textAlign: "center",
          mx: "auto",
          mb: image ? 5 : 2,
          position: "relative",
          "& .drag-drop-area": {
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "primary.light"
          },
          "& > *": {
            width: fluidSize.width,
            height: fluidSize.width,
            borderRadius: "50%"
          }
        }}
      >
        <div
          style={{
            position: "absolute",
            ...(image
              ? {
                  zIndex: 1,
                  opacity: 1,
                  visibility: "visible",
                  pointerEvents: "all"
                }
              : {
                  visibility: "hidden",
                  pointEvents: "none",
                  opaicty: 0,
                  zIndex: -1
                })
          }}
        >
          <Image
            sx={{
              width: "inherit",
              height: "inherit",
              borderRadius: "inherit"
            }}
            src={image ? URL.createObjectURL(image) : ""}
            alt={image ? image.name : ""}
          />
          <Button component="label" htmlFor="drag-drop-area-input-file-upload">
            Change image
          </Button>
        </div>
        <DragDropArea
          autoResetOnDrop
          multiple={false}
          accept="image"
          onDrop={file => {
            setImage(file);
          }}
        >
          <PersonIcon
            sx={{
              fontSize: "6rem",
              color: "primary.dark"
            }}
          />
        </DragDropArea>
      </Box>
      <Stack
        sx={{
          width: "100%",
          flexWrap: "wrap",
          alignItems: "flex-start",
          "& > div": {
            width: {
              xs: "100%",
              sm: "48%"
            }
          }
        }}
      >
        <InputBase
          error
          placeholder="displayName"
          value="Akinrinmola marvellous display name"
        />
        <InputBase
          error
          placeholder="username"
          value="Akinrinmola marvellous user name"
        />
        <InputBase name="email" placeholder="Email" value="Email" />
        <InputBase
          name="location"
          placeholder="Location"
          value="Your location"
        />
        <InputBase
          name="occupation"
          placeholder="Occupation"
          value="Occupation"
        />
        <InputBase
          type="password"
          name="password"
          placeholder="password"
          value="password"
        />
        <InputBase
          name="twitter"
          placeholder="Twitter link"
          value="twitter link"
        />
        <InputBase
          name="linkedIn"
          placeholder="Linkedin link"
          value="linked link"
        />
      </Stack>
      <Button variant="contained" sx={{ width: "100%", mt: 2 }}>
        Submit
      </Button>
    </WidgetContainer>
  );
};

UserProfileForm.propTypes = {};

export default UserProfileForm;
