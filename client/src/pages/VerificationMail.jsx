import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import useForm from "hooks/useForm";
import Button from "@mui/material/Button";
import { WidgetContainer, StyledLink, authLayoutSx } from "components/styled";
import Loading from "components/Loading";
import { Stack } from "@mui/material";
import Typography from "@mui/material/Typography";
import http from "api/http";
import { useContext } from "context/store";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import { useLocation } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import CustomInput from "components/CustomInput";
import {
  HTTP_CODE_INVALID_USER_ACCOUNT,
  HTTP_MSG_VERIFICATION_MAIL
} from "context/constants";
import { isDemoAcc } from "utils/validators";

const VerificationMail = props => {
  const { user } = useLocation().state || {};
  let {
    formData,
    isSubmitting,
    handleSubmit,
    isInValid,
    handleChange,
    reset
  } = useForm({
    isSubmitting: true,
    required: true,
    placeholders: user
  });
  const { setSnackBar, closeSnackBar } = useContext();
  const [verifyState, setVerifyState] = useState("pending");

  useEffect(() => {
    const cb = err => {
      reset(true, {
        errors: err ? { email: err.message } : {},
        isSubmitting: false
      });

      if (err) {
        setSnackBar(err);
        setVerifyState("invalid");
      } else {
        setVerifyState("valid");
        closeSnackBar();
      }
    };

    let id;

    if (formData.email) {
      id = setTimeout(async () => {
        try {
          reset(true, {
            isSubmitting: true
          });

          setVerifyState("pending");

          isDemoAcc(formData.email, true);

          const bool = await http.post(
            `/auth/user-exists?relevance=email`,
            {
              email: formData.email
            },
            {
              withCredentials: true
            }
          );

          if (!bool)
            throw {
              message: HTTP_MSG_VERIFICATION_MAIL
            };

          cb(undefined, true);
        } catch (err) {
          err.severity = "error";
          cb(err);
        }
      }, 500);
    } else
      cb({
        message: "A verification email address is required."
      });

    return () => {
      clearTimeout(id);
    };
  }, [closeSnackBar, setSnackBar, reset, formData.email]);

  const onChange = e => {
    handleChange(e, () => HTTP_MSG_VERIFICATION_MAIL);
  };

  const onSubmit = async e => {
    const formData = handleSubmit(e);
    if (formData) {
      try {
        setSnackBar({
          message: (await http.post("/auth/recover-password", formData))
            .message,
          severity: "success"
        });

        setVerifyState("");

        reset(true);
      } catch (err) {
        reset(true);

        !err.isCancelled &&
          setSnackBar(
            err.code === HTTP_CODE_INVALID_USER_ACCOUNT
              ? HTTP_MSG_VERIFICATION_MAIL
              : err.message
          );
      }
    }
  };

  return (
    <Stack sx={{ minHeight: "100vh", width: "100%" }}>
      <WidgetContainer sx={authLayoutSx} component="form" onSubmit={onSubmit}>
        <Typography variant="h5" textAlign="center" my color="text.secondary">
          Verification Mail
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Your email needs to be registered with us!
        </Typography>
        <CustomInput
          label="Verification Mail"
          type="email"
          error={isInValid}
          name="email"
          value={formData.email || ""}
          onChange={onChange}
          sx={{ my: 1 }}
          endAdornment={
            verifyState && (
              <Stack
                className="input-svg-container"
                sx={{
                  "& svg": {
                    cursor: "default"
                  }
                }}
              >
                {verifyState === "pending" ? (
                  <Loading />
                ) : (
                  {
                    invalid: (
                      <CloseIcon
                        sx={{
                          color: "error.main"
                        }}
                      />
                    ),
                    valid: (
                      <DoneIcon
                        sx={{
                          color: "success.main"
                        }}
                      />
                    )
                  }[verifyState]
                )}
              </Stack>
            )
          }
          startAdornment={
            <Stack>
              <EmailIcon />
            </Stack>
          }
        />
        <Button
          variant="contained"
          disabled={isInValid || isSubmitting}
          sx={{
            width: "100%",
            my: 1,
            py: 1
          }}
          type="submit"
        >
          Send Mail
        </Button>
        <div style={{ width: "100%", textAlign: "center" }}>
          <StyledLink to={"/auth/signin"}>Continue to sign in</StyledLink>
        </div>
      </WidgetContainer>
    </Stack>
  );
};

VerificationMail.propTypes = {};

export default VerificationMail;
