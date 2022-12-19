import React, { useState } from "react";
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
import { Typography } from "@mui/material";
import http from "api/http";
const UserProfileForm = ({
  width,
  sx,
  children,
  routePage = "profilePage"
}) => {
  const { currentUser } = useSelector(state => state.user);
  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  } = useForm({
    required:
      {
        signup: {
          username: true,
          email: true,
          password: true
        }
      }[routePage] || false,
    returnFormObject: true
  });
  const { setSnackBar } = useContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fluidSize = {
    width: "150px"
  };
  const hash = window.location.hash.toLowerCase();

  return (
    <WidgetContainer
      sx={{
        width,
        ...sx
      }}
      onSubmit={async e => {
        try {
          const formData = handleSubmit(e);
          if (formData) {
            (({
              signup: false
            }[routePage] ||
              true) &&
              dispatch(
                updateUser(
                  await http[{ signup: "post" }[routePage] || "put"](
                    {
                      signup: "/auth/signup"
                    }[routePage] || "/user",
                    formData
                  )
                )
              ));
            setSnackBar({
              message:
                {
                  signup: "Thank you for registering. You can login!"
                }[routePage] || "Updated profile successfully!",
              severity: "success"
            });
          }
          reset();
        } catch (message) {
          setSnackBar(message);
          reset(true);
        }
      }}
      component="form"
    >
      <Box
        sx={{
          ...fluidSize,
          textAlign: "center",
          mx: "auto",
          mb: formData.avatar ? 5 : 2,
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
            ...(formData.avatar
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
            src={formData.avatar ? URL.createObjectURL(formData.avatar) : ""}
            alt={formData.avatar ? formData.avatar.name : ""}
          />
          <Button component="label" htmlFor="drag-drop-area-input-file-upload">
            Change Avatar
          </Button>
        </div>
        <DragDropArea
          autoResetOnDrop
          multiple={false}
          accept=".jpg,.jpeg,.png"
          onDrop={file => {
            navigate("");
            handleChange({
              currentTarget: {
                name: "avatar",
                files: file,
                type: "file"
              }
            });
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
            searchValue: "uname",
            required: { signup: true }[routePage] || false
          },
          {
            name: "email",
            placeholder: "Email",
            searchValue: "email",
            required: { signup: true }[routePage] || false
          },
          {
            name: "password",
            placeholder: "Password",
            searchValue: "pwd",
            required: { signup: true }[routePage] || false
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
            name: "twitter",
            placeholder: "Twitter Link",
            searchValue: "twitter"
          },
          {
            name: "linkedIn",
            placeholder: "LinkedIn link",
            searchValue: "linkedin"
          },
          {
            name: "aboutMe",
            placeholder: "Write something about yourself",
            searchValue: "desc",
            type: "feedback"
          }
        ].map(i => (
          <div key={i.name}>
            <InputBase
              key={i.name}
              id={`user-${i.name}`}
              name={i.name}
              placeholder={i.placeholder}
              value={formData[i.name] || currentUser?.[i.name] || ""}
              error={errors[i.name] || errors.all}
              inputRef={input => {
                hash === `#user-${i.searchValue}` && input && input.focus();
              }}
              onChange={e => {
                if (hash !== i.searchValue) {
                  navigate(`?#user-${i.searchValue}`, {
                    replace: true
                  });
                }
                if (
                  handleChange(e, (key, value) => {
                    switch (key) {
                      case "twitter":
                      case "linkedIn":
                        return isLink(value) ? "" : "Expect a valid link";
                      default:
                        break;
                    }
                  })
                ) {
                  const user = {};
                  switch (i.name) {
                    case "twitter":
                    case "linkedIn":
                      user.socials = {
                        [i.name]: {
                          label: i.name,
                          url: e.target.value
                        }
                      };
                    default:
                      user[i.name] = e.target.value;
                  }
                  dispatch(updatePreviewUser(user));
                }
              }}
              components={
                {
                  // Input: i.type === "feedback" ? "textarea" : ""
                }
              }
            />
          </div>
        ))}
      </Stack>
      <Button
        type="submit"
        variant="contained"
        sx={{ width: "100%", mt: 2 }}
        disabled={isSubmitting}
      >
        Submit
      </Button>
      {children}
    </WidgetContainer>
  );
};

UserProfileForm.propTypes = {};

export default UserProfileForm;
