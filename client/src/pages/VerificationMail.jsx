import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import useForm from "hooks/useForm";
import Button from "@mui/material/Button";
import { WidgetContainer, StyledLink } from "components/styled";
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

const verifyUser = debounce(async (v, cb, relevance = "placeholder") => {
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
  const {
    formData,
    isSubmitting,
    handleSubmit,
    errors: { all: withErr },
    handleChange,
    reset
  } = useForm({
    required: true,
    placeholders: user
  });
  const { setSnackBar, setContext, closeSnackBar } = useContext();
  const [verifyState, setVerifyState] = useState("");
  const stateRef = useRef({ err: true });
  const hasError = stateRef.current.err || withErr;
  const verifyMsg = {
    message: (
      <span>
        Verification mail isn't registered to an account.
        <br />{" "}
        {stateRef.current.isEmail ? (
          <>
            <StyledLink
              to="/auth/signup"
              onClick={() =>
                setContext(prev => ({
                  ...prev,
                  userPlaceholder: formData,
                  userPlaceholderMethod: "post"
                }))
              }
            >
              Signup
            </StyledLink>{" "}
            for a new account
          </>
        ) : null}{" "}
      </span>
    ),
    severity: "error",
    onClose() {}
  };
  const onChange = e => {
    handleChange(e, ({ error }) => {
      if (error) {
        stateRef.current.err = true;
        stateRef.current.isEmail = false;
        setVerifyState("");
        const id = setTimeout(() => {
          setSnackBar(error);
          clearTimeout(id);
        }, 0);
      } else {
        stateRef.current.isEmail = true;
        setVerifyState("pending");
        verifyUser(
          e.target.value,
          (err, bool) => {
            if (err) {
              setSnackBar(err);
              setVerifyState("");
            } else if (bool) {
              stateRef.current.err = false;
              setVerifyState("valid");
              closeSnackBar();
            } else {
              stateRef.current.err = true;
              setVerifyState("invalid");
              setSnackBar(verifyMsg);
            }
          },
          "email"
        );
      }
    });
  };
  const onSubmit = async e => {
    const formData = handleSubmit(e);
    if (formData) {
      try {
        setSnackBar({
          message: (await http.post("/auth/recover-password", formData)) + ".",
          severity: "success"
        });
        stateRef.current.isEmail = undefined;
        stateRef.current.err = true;
        setVerifyState("");
        reset();
      } catch (err) {
        if (err === "Account isn't registered") {
          stateRef.current.err = true;
          err = verifyMsg;
        }
        setSnackBar(err);
        reset(true);
      }
    }
  };

  return (
    <Stack sx={{ minHeight: "100vh", width: "100%" }}>
      <WidgetContainer
        sx={{
          maxWidth: "400px",
          mx: "auto",
          height: "auto",
          minHeight: "0"
        }}
        component="form"
        onSubmit={onSubmit}
      >
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
          error={stateRef.current.isEmail !== undefined && hasError}
          name="email"
          value={formData.email || ""}
          onChange={onChange}
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
          disabled={hasError || isSubmitting}
          sx={{
            width: "100%"
          }}
          type="submit"
        >
          Continue
        </Button>
      </WidgetContainer>
    </Stack>
  );
};

VerificationMail.propTypes = {};

export default VerificationMail;
