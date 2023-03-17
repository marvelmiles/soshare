import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import useForm, { isLink } from "hooks/useForm";
import { WidgetContainer, Image } from "./styled";
import Box from "@mui/material/Box";
import DragDropArea from "./DragDropArea";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import InputBase from "@mui/material/InputBase";
import PersonIcon from "@mui/icons-material/Person";
import { useDispatch, useSelector } from "react-redux";
import { updatePreviewUser, updateUser } from "redux/userSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useContext } from "redux/store";
import { Typography, IconButton } from "@mui/material";
import http from "api/http";
import Avatar from "@mui/material/Avatar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";
import img2 from "imgs/img2.jpg";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
const UserProfileForm = ({
  width,
  sx,
  children,
  readOnly,
  placeholders,
  withConfirmPwd
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const {
    formData,
    errors,
    isSubmitting,
    stateChanged,
    handleChange,
    handleSubmit,
    reset
  } = useForm({
    required: placeholders
      ? false
      : {
          username: true,
          email: true,
          password: true
        },
    returnFormObject: true,
    dataType: {
      socials: "object"
    }
  });
  const { setSnackBar } = useContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fluidSize = {
    width: "150px"
  };
  const hash = window.location.hash.toLowerCase();

  useEffect(() => {
    if (stateChanged) {
      dispatch(
        updatePreviewUser({
          ...formData,
          photoUrl: formData.avatar ? URL.createObjectURL(formData.avatar) : ""
        })
      );
    }
  }, [dispatch, stateChanged, formData]);

  const onSubmit = async e => {
    try {
      const formData = handleSubmit(e);
      console.log(formData, formData?.get("avatar"), " processed data");
      let user = placeholders;
      if (formData) {
        user = await http[placeholders ? "put" : "post"](
          placeholders ? "/users" : "/auth/signup",
          formData
        );
        setSnackBar({
          message: placeholders
            ? "Updated profile successfully!"
            : "Thank you for registering. You can login!",
          severity: "success"
        });
      }
      // console.log("reset ", user);
      reset(placeholders && user);
    } catch (message) {
      setSnackBar(message);
      reset(true);
    }
  };

  const handlePhotoTransfer = file => {
    navigate("");
    reset(
      {
        ...formData,
        avatar: file
      },
      { stateChanged: true }
    );
  };

  const handlePhotoReset = e => {
    e.preventDefault();
    e.stopPropagation();
    const data = {
      ...formData
    };
    delete data.avatar;
    reset(data);
  };

  // formData.photoUrl && console.log(formData.photoUrl, "reset url");
  return (
    <WidgetContainer
      sx={{
        width,
        maxHeight: "none",
        ...sx
      }}
      onSubmit={onSubmit}
      component="form"
    >
      <Box
        sx={{
          textAlign: "center",
          mx: "auto",
          height: "175px",
          mb: 1,
          position: "relative",
          ".drag-drop-area,.MuiAvatar-root": {
            borderRadius: "50%",
            backgroundColor: "primary.light",
            color: "primary.dark",
            width: fluidSize.width,
            height: fluidSize.width,
            borderRadius: "50%",
            cursor: "pointer",
            mx: "auto"
          },
          ".drag-drop-area": {
            mb: 1
          }
        }}
      >
        {readOnly ? (
          <Avatar
            src={placeholders?.photoUrl}
            alt={`${placeholders?.username} avatar`}
            title={`${placeholders?.username} avatar`}
          />
        ) : (
          <>
            <DragDropArea
              autoResetOnDrop
              multiple={false}
              accept=".jpg,.jpeg,.png"
              onDrop={handlePhotoTransfer}
              disabled={isSubmitting}
            >
              <div style={{ position: "relative" }}>
                <Avatar
                  component="label"
                  htmlFor="drag-drop-area-input-file-upload"
                  src={
                    formData.avatar
                      ? URL.createObjectURL(formData.avatar)
                      : formData.photoUrl || placeholders?.photoUrl || ""
                  }
                  alt={
                    formData.avatar
                      ? `${formData.avatar.name} photo`
                      : `@${formData.username || placeholders?.username}`
                  }
                  title={
                    formData.avatar
                      ? `${formData.avatar.name} photo`
                      : `@${formData.username || placeholders?.username}`
                  }
                />
                <IconButton
                  sx={{ position: "absolute", bottom: 0, right: "15px" }}
                  component="label"
                  htmlFor="drag-drop-area-input-file-upload"
                  disabled={isSubmitting}
                >
                  <AddAPhotoIcon />
                </IconButton>
              </div>
            </DragDropArea>
            {formData.avatar ? (
              <Button disabled={isSubmitting} onClick={handlePhotoReset}>
                Reset avatar
              </Button>
            ) : null}
          </>
        )}
      </Box>
      {console.log(formData)}
      <Stack
        sx={{
          width: "100%",
          flexWrap: "wrap",
          alignItems: "flex-start",
          "& > div": {
            minWidth: {
              xs: "100%",
              sm: "48%"
            },
            flex: 1
          }
        }}
      >
        {[
          {
            name: "username",
            placeholder: "Username",
            searchValue: "uname"
          },
          {
            name: "email",
            placeholder: "Email",
            searchValue: "email"
          },
          {
            name: "password",
            placeholder: "Password",
            searchValue: "pwd",
            type: showPwd ? "text" : "password",
            endAdornment: withConfirmPwd
              ? null
              : showPwd
              ? VisibilityOffIcon
              : VisibilityIcon,
            onEndAdornmentClick: () => setShowPwd(!showPwd)
          },
          {
            name: "confirmPassword",
            placeholder: "Confirm Password",
            searchValue: "user-cpwd",
            type: "password",
            nullify: !withConfirmPwd
          },
          {
            name: "displayName",
            placeholder: "Display name",
            searchValue: "dname"
          },

          {
            name: "occupation",
            placeholder: "Occupation",
            searchValue: "job"
          },
          {
            name: "location",
            placeholder: "Country/City",
            searchValue: "loc"
          },
          {
            name: "socials",
            placeholder: "Twitter Link",
            searchValue: "twitter",
            dataName: "twitter"
          },
          {
            name: "socials",
            placeholder: "LinkedIn link",
            searchValue: "linkedin",
            dataName: "linkedIn"
          },
          {
            name: "bio",
            placeholder: "Write something about yourself",
            searchValue: "bio",
            multiline: true,
            max: 280
          }
        ].map((i, index) =>
          i.nullify ? null : (
            <Box key={index}>
              <Box
                sx={
                  i.multiline && {
                    border: "1px solid #000",
                    borderColor: "divider",
                    border: 1,
                    p: "0px",
                    borderRadius: "5px"
                  }
                }
              >
                <InputBase
                  key={index}
                  type={i.type}
                  id={`user-${i.name}`}
                  name={i.name}
                  placeholder={i.placeholder}
                  sx={
                    i.multiline && {
                      border: "none",
                      mb: 0,
                      p: 0,
                      m: 0,
                      borderRadius: 0
                    }
                  }
                  inputProps={{
                    style: {
                      paddingTop: "8px",
                      paddingBottom: "8px"
                    },
                    "data-name": i.dataName
                  }}
                  value={
                    typeof formData[i.name] === "undefined"
                      ? (i.dataName
                          ? (placeholders[i.name] || {})[i.dataName]
                          : placeholders[i.name]) || ""
                      : i.dataName
                      ? formData[i.name][i.dataName]
                      : formData[i.name]
                  }
                  error={
                    !!(
                      (i.dataName
                        ? errors[i.name]?.[i.dataName]
                        : errors[i.name]) || errors.all
                    )
                  }
                  readOnly={readOnly || isSubmitting}
                  multiline={i.multiline}
                  rows={i.multiline && 1}
                  endAdornment={
                    i.endAdornment ? (
                      <IconButton
                        sx={{
                          mr: "4px",
                          backgroundColor: "transparent"
                        }}
                        onClick={i.onEndAdornmentClick}
                      >
                        <i.endAdornment />
                      </IconButton>
                    ) : null
                  }
                  inputRef={input => {
                    hash === `#user-${i.searchValue}` && input && input.focus();
                  }}
                  onChange={e => {
                    const value = e.currentTarget.value;
                    if (value.length > i.max) return false;
                    if (hash !== i.searchValue)
                      navigate(`?#user-${i.searchValue}`);
                    handleChange(e, (key, value) => {
                      switch (key) {
                        case "socials":
                          return isLink(value) ? "" : "Expect a valid link";
                        default:
                          return false;
                      }
                    });
                  }}
                />
                {i.multiline ? (
                  <Typography sx={{ textAlign: "right", p: "8px", pt: 0 }}>
                    {formData[i.name]?.length || 0} / {i.max}
                  </Typography>
                ) : null}
              </Box>
              {(i.name === "password" || i.name === "confirmPassword") &&
              errors[i.name] !== "required" ? (
                <Typography
                  color={
                    !!(errors.password || errors.all)
                      ? {
                          "Weak password": "warning.main",
                          "Medium password": "warning.main"
                        }[errors.password] || ""
                      : "error.main"
                  }
                >
                  {errors.password === "minimum of 8"
                    ? errors[i.name] + " characters"
                    : errors[i.name]}
                </Typography>
              ) : null}
            </Box>
          )
        )}
      </Stack>
      {readOnly ? null : (
        <Button
          type="submit"
          variant="contained"
          sx={{ width: "100%", mt: 2 }}
          disabled={isSubmitting}
        >
          {placeholders ? "Update" : "Submit"}
        </Button>
      )}
      {children}
    </WidgetContainer>
  );
};

UserProfileForm.propTypes = {};

export default UserProfileForm;
