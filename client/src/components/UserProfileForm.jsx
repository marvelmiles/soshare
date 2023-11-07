import React, { useEffect, useCallback, useState, useRef } from "react";
import PropTypes from "prop-types";
import useForm from "hooks/useForm";
import { WidgetContainer, StyledLink, StyledAvatar } from "components/styled";
import { LoadingDot } from "components/Loading";
import Box from "@mui/material/Box";
import DragDropArea from "./DragDropArea";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useDispatch } from "react-redux";
import {
  updatePreviewUser,
  deleteFromPreviewUser,
  updateUser
} from "context/slices/userSlice";
import { useContext } from "context/store";
import { Typography, IconButton } from "@mui/material";
import http, { handleCancelRequest } from "api/http";
import Avatar from "@mui/material/Avatar";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import CustomInput from "./CustomInput";
import { debounce } from "@mui/material";

const withDebounceFn = debounce(cb => cb(), 400);

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
    ? false
    : {
        username: true,
        email: true,
        password: true,
        confirmPassword: true
      },
  requiredOnly,
  method
}) => {
  const { setSnackBar, locState } = useContext();

  const stateRef = useRef({
    fileKey: `drag-drop-area-input-file-upload-${Date.now()}`
  });

  const fileRef = useRef();

  const [photoUrl, setPhotoUrl] = useState(placeholders?.photoUrl);
  placeholders = locState.user || placeholders;

  const {
    formData,
    errors,
    isSubmitting,
    isInValid,
    handleChange,
    handleSubmit,
    reset
  } = useForm({
    required,
    returnFormObject: true,
    dataType: {
      socials: "object"
    },
    withPlaceholders: false,
    dataSize: 4
  });

  const dispatch = useDispatch();

  const fluidSize = {
    xs: "50px",
    s200: "120px",
    s280: "120px"
  };

  const hasChanged = (() => {
    let hasChanged = false;
    for (const key in formData) {
      switch (key) {
        case "socials":
          for (const key in formData.socials) {
            hasChanged = placeholders.socials[key] !== formData.socials[key];
          }
          break;
        default:
          hasChanged = formData[key] !== placeholders?.[key];
          break;
      }
      if (hasChanged) break;
    }
    return hasChanged;
  })()
    ? !isInValid
    : false;

  useEffect(() => {
    let photoUrl;

    const stateCtx = stateRef.current;

    withDebounceFn(() => {
      const node = document.activeElement;
      const key = node.name;
      const name = node.dataset.name;

      if (errors[key] || errors[name]) {
        if (node.nodeName === "INPUT") {
          dispatch(deleteFromPreviewUser({ [key]: name }));
        }
      } else {
        photoUrl = formData.avatar ? URL.createObjectURL(formData.avatar) : "";

        const data = {};

        for (const key in formData) {
          if (!errors[key]) data[key] = formData[key];
        }
        dispatch(
          updatePreviewUser({
            ...data,
            photoUrl
          })
        );
      }
    });
    return () => {
      stateCtx.url && handleCancelRequest(stateCtx.url);
      photoUrl && URL.revokeObjectURL(photoUrl);
    };
  }, [dispatch, isInValid, formData, errors]);

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
        const stateCtx = stateRef.current;

        const formData = handleSubmit(e, {
          formData: new FormData()
        });

        if (formData) {
          const url = placeholders ? "/users" : "/auth/signup";

          stateCtx.url = url;

          const res = await http[method || (placeholders ? "put" : "post")](
            url,
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

          reset(placeholders && res);

          res.forceUpdate = true;

          placeholders && dispatch(updateUser(res));

          handleAction &&
            handleAction(placeholders ? "update" : "new", {
              document: res
            });
        }
      } catch (err) {
        !err.isCancelled && setSnackBar(err.message);
        reset(true);
      }
    },
    [
      handleAction,
      handleSubmit,
      placeholders,
      reset,
      setSnackBar,
      method,
      dispatch
    ]
  );
  const handlePhotoTransfer = file => {
    reset({
      ...formData,
      avatar: file
    });
  };

  const handlePhotoReset = e => {
    e.preventDefault();
    e.stopPropagation();
    const data = {
      ...formData
    };

    delete data.avatar;
    fileRef.current.value = "";

    reset(data);
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
              title={`${placeholders?.username ||
                placeholders?.displayName ||
                "blank"} avatar`}
            />
          </StyledAvatar>
        ) : (
          <Box>
            <DragDropArea
              ref={fileRef}
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
                mx: "auto",
                ...(formData.avatar
                  ? { borderColor: "primary.dark" }
                  : undefined)
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
                      : `@${formData.username ||
                          formData.displayName ||
                          placeholders?.username ||
                          placeholders?.displayName ||
                          "avatar"}`
                  }
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "inherit",
                    position: "relative",
                    "svg#person-icon": {
                      width: "75%",
                      height: "75%"
                    },
                    "svg#upload-icon": {
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      zIndex: 1,
                      width: "20px",
                      height: "20px",
                      color: "grey.600",
                      top: "30px"
                    }
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
            width: {
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
            nullify: requiredOnly,
            type: "url"
          },
          {
            name: "socials",
            placeholder: "LinkedIn link",
            searchValue: "linkedin",
            dataName: "linkedIn",
            nullify: requiredOnly,
            type: "url"
          },
          {
            name: "bio",
            placeholder: "Write something about yourself",
            searchValue: "bio",
            multiline: true,
            max: 250,
            nullify: requiredOnly
          }
        ].map((input, index) => {
          const value =
            (formData[input.name] === undefined && placeholders
              ? input.dataName
                ? placeholders[input.name][input.dataName]
                : placeholders[input.name]
              : input.dataName
              ? formData[input.name]?.[input.dataName]
              : formData[input.name]) || "";

          return input.nullify ? null : (
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
              sx={
                input.multiline
                  ? {
                      ".custom-input": {
                        mt: 2
                      }
                    }
                  : undefined
              }
              rows={input.multiline ? 2 : undefined}
              error={
                (input.dataName
                  ? errors[input.name]?.[input.dataName]
                  : errors[input.name]) || errors.all
              }
              required={required && (required === true || required[input.name])}
              value={value}
              data-changed={!!value}
              onChange={handleChange}
            />
          );
        })}
      </Stack>

      {readOnly ? null : (
        <Button
          type="submit"
          variant="contained"
          sx={{ width: "100%", mt: 2, py: 1 }}
          disabled={!hasChanged || isSubmitting}
        >
          {isSubmitting ? (
            <LoadingDot sx={{ py: 1 }} />
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
