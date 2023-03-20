import React, { useState } from "react";
import PropTypes from "prop-types";
import useForm, { isEmail } from "hooks/useForm";
import Button from "@mui/material/Button";
import {
  WidgetContainer,
  Loading,
  StyledTypography,
  StyledLink
} from "components/styled";
import { InputBase, Stack, debounce } from "@mui/material";
import Typography from "@mui/material/Typography";
import http from "api/http";
import { useContext } from "redux/store";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import { useLocation } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";

const verifyUser = debounce(async (v, cb, relevance = "placeholder") => {
  try {
    if (v) {
      cb(
        undefined,
        await http.post(
          `/auth/user-exist?relevance=${relevance}`,
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
    errors,
    isSubmitting,
    handleSubmit,
    handleChange,
    reset
  } = useForm({
    required: true,
    placeholders: user
  });
  const { setSnackBar } = useContext();
  const [isVerifying, setIsVerifying] = useState("");
  const err = isVerifying === "close";

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
        onSubmit={async e => {
          const formData = handleSubmit(e);
          // return console.log("on submit.. ", formData);
          if (formData) {
            console.log(isVerifying, " is verfying...");
            try {
              setSnackBar(await http.post("/auth/recover-password", formData));
              reset();
            } catch (err) {
              console.log("ddddddddddd");
              if (err === "Account isn't registered") {
                err = (
                  <Typography>
                    Please{" "}
                    <StyledLink
                      state={
                        isEmail(formData.email)
                          ? {
                              user: formData
                            }
                          : undefined
                      }
                      to="/auth/signup"
                    >
                      signup
                    </StyledLink>{" "}
                    account before proceeding with verification.
                  </Typography>
                );
              }
              setSnackBar(err);
              reset(true);
            }
          }
        }}
      >
        <Typography variant="h5" textAlign="center">
          Verification Mail
        </Typography>
        <Typography variant="capti" color="warning.main">
          Your email needs to be registered before you can proceed with
          verification. Thank you for your cooperation
        </Typography>
        <InputBase
          sx={{ py: "5px", mb: err ? 0 : undefined }}
          name="email"
          placeholder="Verification mail"
          value={formData.email || ""}
          onInput={async e => {
            console.log("home ucon...", e.target, formData);
            handleChange(e);
            verifyUser(
              e.target.value,
              (err, bool) => {
                console.log(err, bool, " er ");
                if (err) setSnackBar(err);
                else if (bool) {
                  if (bool === "pending") setIsVerifying(bool);
                  setIsVerifying("done");
                } else setIsVerifying("close");
              },
              "email"
            );
          }}
          type="email"
          error={!!(errors.email || errors.all || err)}
          endAdornment={
            isVerifying && (
              <Stack style={{ paddingRight: "8px" }}>
                {isVerifying === "pending" ? (
                  <Loading />
                ) : (
                  {
                    close: (
                      <CloseIcon
                        sx={{
                          color: "error.main"
                        }}
                      />
                    ),
                    done: (
                      <DoneIcon
                        sx={{
                          fill: "success.main"
                        }}
                      />
                    )
                  }[isVerifying]
                )}
              </Stack>
            )
          }
          startAdornment={
            <Stack sx={{ p: 1 }}>
              <EmailIcon />
            </Stack>
          }
        />
        {err ? (
          <StyledTypography variant="caption" color="error">
            Email isn't registered
          </StyledTypography>
        ) : null}

        <Button
          variant="contained"
          disabled={isSubmitting}
          sx={{
            width: "100%"
          }}
          type="submit"
        >
          Send token
        </Button>
      </WidgetContainer>
    </Stack>
  );
};

VerificationMail.propTypes = {};

export default VerificationMail;
