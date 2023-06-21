import React, { useEffect, useCallback, useState, useRef } from "react";
import PropTypes from "prop-types";
import useForm, { isLink } from "hooks/useForm";
import { WidgetContainer, StyledLink, StyledAvatar } from "components/styled";
import { LoadingDot } from "components/Loading";
import Box from "@mui/material/Box";
import DragDropArea from "./DragDropArea";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useDispatch } from "react-redux";
import {
  updatePreviewUser,
  deleteFromPreviewUser
} from "context/slices/userSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "context/store";
import { Typography, IconButton } from "@mui/material";
import http from "api/http";
import Avatar from "@mui/material/Avatar";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import CustomInput from "./CustomInput";

const UserProfileForm = ({
  width,
  sx,
  children,
  readOnly,
  placeholders,
  withConfirmPwd = !placeholders,
  hidePwd,
  handleAction,
  required = placeholders
    ? true
    : {
        username: true,
        email: true,
        password: true
      },
  requiredOnly,
  method
}) => {
  const stateRef = useRef({
    fileKey: `drag-drop-area-input-file-upload-${Date.now()}`
  });
  const [photoUrl, setPhotoUrl] = useState(placeholders?.photoUrl);
  const locState = useLocation().state;
  const {
    formData,
    errors,
    isSubmitting,
    stateChanged,
    handleChange,
    handleSubmit,
    reset
  } = useForm({
    required,
    returnFormObject: true,
    dataType: {
      socials: "object"
    },
    placeholders: locState?.user || placeholders,
    withPlaceholders: false,
    deleteEmptyField: false,
    exclude: !!placeholders,
    dataSize: 3
  });
  const { setSnackBar } = useContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fluidSize = {
    xs: "50px",
    s200: "120px",
    s280: "120px"
  };
  useEffect(() => {
    let url;
    const node = document.activeElement;
    const key = node.name;
    const name = node.dataset.name;
    if (errors[key] || errors[name]) {
      if (node.nodeName === "INPUT") {
        dispatch(deleteFromPreviewUser({ [key]: name }));
      }
    } else if (stateChanged) {
      url = formData.avatar ? URL.createObjectURL(formData.avatar) : "";

      dispatch(
        updatePreviewUser({
          ...formData,
          photoUrl: url
        })
      );
    }

    return () => url && URL.revokeObjectURL(url);
  }, [dispatch, stateChanged, formData, errors]);

  useEffect(() => {
    const url = formData.avatar ? URL.createObjectURL(formData.avatar) : "";
    setPhotoUrl(url || formData.photoUrl || placeholders?.photoUrl);
    return () => {
      url && URL.revokeObjectURL(url);
    };
  }, [formData.avatar, placeholders?.photoUrl, formData.photoUrl]);

  const onSubmit = useCallback(
    async e => {
      try {
        const formData = handleSubmit(e);
        let user;

        if (formData) {
          user = await http[method || (placeholders ? "put" : "post")](
            placeholders ? "/users" : "/auth/signup",
            formData
          );
          setSnackBar({
            message: placeholders ? (
              "Updated profile successfully!"
            ) : (
              <Typography>
                Thank you for registering. You can{" "}
                <StyledLink to="/auth/signin">login</StyledLink>!
              </Typography>
            ),
            severity: "success"
          });

          reset(placeholders && user);
          handleAction &&
            handleAction(placeholders ? "update" : "new", { document: user });
        }
      } catch (message) {
        setSnackBar(message);
        reset(true, {
          stateChanged: true
        });
      }
    },
    [handleAction, handleSubmit, placeholders, reset, setSnackBar, method]
  );
  const handlePhotoTransfer = file => {
    reset(
      {
        ...formData,
        avatar: file
      },
      { stateChanged: true, withInput: true }
    );
  };

  const handlePhotoReset = e => {
    e.preventDefault();
    e.stopPropagation();
    const data = {
      ...formData
    };
    delete data.avatar;
    reset(data, {
      resetErrors: false
    });
  };
  const resetForm = e => {
    e.stopPropagation();
    reset(placeholders);
    dispatch(updatePreviewUser(placeholders));
  };

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
          mb: 2,
          position: "relative"
        }}
      >
        {readOnly ? (
          <StyledAvatar
            sx={{
              width: fluidSize,
              height: fluidSize,
              mx: "auto"
            }}
          >
            <Avatar
              sx={{
                svg: {
                  cursor: "default"
                }
              }}
              src={placeholders?.photoUrl}
              title={`${placeholders?.username || "blank"} avatar`}
            />
          </StyledAvatar>
        ) : (
          <Box>
            <DragDropArea
              autoResetOnDrop
              multiple={false}
              mimetype="image"
              accept=".jpg,.jpeg,.png"
              onDrop={handlePhotoTransfer}
              disabled={isSubmitting}
              inputKey={stateRef.current.fileKey}
              name="avatar"
              component={StyledAvatar}
              sx={{
                width: fluidSize,
                height: fluidSize,
                mx: "auto"
              }}
            >
              <div
                className="styled-avatar-avatar"
                style={{
                  position: "relative"
                }}
              >
                <Avatar
                  src={photoUrl}
                  title={
                    formData.avatar
                      ? `${formData.avatar.name} photo`
                      : `@${((formData.avatar || placeholders?.photoUrl) &&
                          (formData.username || placeholders?.username)) ||
                          "avatar"}`
                  }
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "inherit"
                  }}
                />
                <IconButton
                  htmlFor={stateRef.current.fileKey}
                  sx={{
                    position: "absolute",
                    bottom: "-10px",
                    right: "10px",
                    backgroundColor: "background.alt",
                    "&:hover": {
                      backgroundColor: "action.altHover"
                    }
                  }}
                  component="label"
                  disabled={isSubmitting}
                >
                  <AddAPhotoIcon />
                </IconButton>
              </div>
            </DragDropArea>
            {formData.avatar ? (
              <Button
                disabled={isSubmitting}
                onClick={handlePhotoReset}
                variant="contained"
                sx={{
                  mt: "6px",
                  ml: "10px",
                  py: "4px",
                  backgroundColor: "common.hover",
                  "&:hover": {
                    backgroundColor: "common.lightHover"
                  }
                }}
                variant="text"
              >
                Reset avatar
              </Button>
            ) : null}
          </Box>
        )}
      </Box>
      {placeholders ? (
        <Button
          disabled={isSubmitting}
          onClick={resetForm}
          sx={{ p: "4px", mb: 1, float: "right" }}
        >
          Reset form
        </Button>
      ) : null}
      <Stack
        sx={{
          width: "100%",
          flexWrap: "wrap",
          alignItems: "flex-start",
          "& > *": {
            minWidth: {
              xs: "100%",
              sm: "48%"
            }
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
            type: "password",
            nullify: hidePwd,
            min: 8
          },
          {
            name: "confirmPassword",
            placeholder: "Confirm Password",
            searchValue: "user-cpwd",
            type: "password",
            nullify: hidePwd || !withConfirmPwd,
            min: 8
          },
          {
            name: "displayName",
            placeholder: "Display name",
            searchValue: "dname",
            nullify: requiredOnly
          },

          {
            name: "occupation",
            placeholder: "Occupation",
            searchValue: "job",
            nullify: requiredOnly
          },
          {
            name: "location",
            placeholder: "Country/City",
            searchValue: "loc",
            nullify: requiredOnly
          },
          {
            name: "socials",
            placeholder: "Twitter Link",
            searchValue: "twitter",
            dataName: "twitter",
            nullify: requiredOnly
          },
          {
            name: "socials",
            placeholder: "LinkedIn link",
            searchValue: "linkedin",
            dataName: "linkedIn",
            nullify: requiredOnly
          },
          {
            name: "bio",
            placeholder: "Write something about yourself",
            searchValue: "bio",
            multiline: true,
            max: 250,
            nullify: requiredOnly
          }
        ].map((input, index) =>
          input.nullify ? null : (
            <CustomInput
              key={index}
              multiline={input.multiline}
              type={input.type}
              id={`user-${input.dataName || input.name}`}
              name={input.name}
              label={input.placeholder}
              readOnly={readOnly || isSubmitting}
              data-name={input.dataName}
              data-min={input.min}
              data-max={input.max}
              rows={2}
              error={
                (input.dataName
                  ? errors[input.name]?.[input.dataName]
                  : errors[input.name]) || errors.all
              }
              required={required && (required === true || required[input.name])}
              value={
                (formData[input.name] === undefined && placeholders
                  ? input.dataName
                    ? placeholders[input.name][input.dataName]
                    : placeholders[input.name]
                  : input.dataName
                  ? formData[input.name]?.[input.dataName]
                  : formData[input.name]) || ""
              }
              onChange={e => {
                handleChange(e, ({ key, value, validate }) => {
                  switch (key) {
                    case "socials":
                      if (validate)
                        return isLink(value) ? "" : "Invalid profile link";
                      else return "";
                    default:
                      return false;
                  }
                });
              }}
            />
          )
        )}
      </Stack>

      {readOnly ? null : (
        <Button
          type="submit"
          variant="contained"
          sx={{ width: "100%", mt: 2 }}
          disabled={!stateChanged || isSubmitting}
        >
          {isSubmitting ? (
            <LoadingDot />
          ) : (method === "post" ? (
              false
            ) : (
              placeholders
            )) ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      )}
      {children}
    </WidgetContainer>
  );
};

UserProfileForm.propTypes = {};

export default UserProfileForm;
