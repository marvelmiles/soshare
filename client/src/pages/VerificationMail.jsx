import React, { useState, useRef, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import useForm from "hooks/useForm";
import Button from "@mui/material/Button";
import { WidgetContainer, StyledLink, authLayoutSx } from "components/styled";
import Loading from "components/Loading";
import { Stack, debounce } from "@mui/material";
import Typography from "@mui/material/Typography";
import http from "api/http";
import { useContext } from "context/store";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import { useLocation } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import CustomInput from "components/CustomInput";
import { HTTP_CODE_INVALID_USER_ACCOUNT } from "context/constants";

const verifyUser = debounce(async (v, cb, relevance = "email") => {
  try {
    if (v) {
      cb(
        undefined,
        await http.post(
          `/auth/user-exists?relevance=${relevance}`,
          {
            [relevance]: v
          },
          {
            withCredentials: true
          }
        )
      );
    }
  } catch (err) {
    return cb(err);
  }
}, 500);

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
    required: true,
    placeholders: user
  });
  const { setSnackBar, closeSnackBar } = useContext();
  const [verifyState, setVerifyState] = useState("");

  const stateRef = useRef({
    typed: false,
    email: formData.email,
    verifyMsg: {
      message: <span>Verification mail isn't registered to an account.</span>,
      severity: "error",
      onClose() {}
    }
  });

  if (!stateRef.current.typed) {
    isInValid = false;
    isSubmitting = true;
  }

  const onVerifyUser = useCallback(
    (err, bool) => {
      if (err) {
        setSnackBar(err);
        setVerifyState("");
      } else if (bool) {
        stateRef.current.typed = true;
        setVerifyState("valid");
        closeSnackBar();
        reset(true, { errors: {} });
      } else {
        setVerifyState("invalid");
        setSnackBar(stateRef.current.verifyMsg);
      }
    },
    [closeSnackBar, setSnackBar, reset]
  );

  useEffect(() => {
    verifyUser(stateRef.current.email, onVerifyUser);
  }, [onVerifyUser]);

  const onChange = e => {
    stateRef.current.typed = true;
    handleChange(e, ({ error }) => {
      if (error) {
        setVerifyState("");
        const id = setTimeout(() => {
          setSnackBar(error);
          clearTimeout(id);
        }, 0);
      } else {
        setVerifyState("pending");

        verifyUser(e.target.value, onVerifyUser);

        return "Invalid verification mail";
      }
    });
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

        if (err.code === HTTP_CODE_INVALID_USER_ACCOUNT)
          err = stateRef.current.verifyMsg;

        setSnackBar(err.message);
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
          Your email needs to be registered before you can proceed with
          verification.
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
        <StyledLink
          sx={{ textAlign: "center", width: "100%" }}
          to={"/auth/signin"}
        >
          Continue to sign in
        </StyledLink>
      </WidgetContainer>
    </Stack>
  );
};

VerificationMail.propTypes = {};

export default VerificationMail;
