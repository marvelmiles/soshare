import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "components/Loading";
import { WidgetContainer } from "components/styled";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import http from "api/http";
import useForm from "hooks/useForm";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import { useContext } from "context/store";
import LockIcon from "@mui/icons-material/Lock";
const ResetPwd = props => {
  const { token = "82bde974bc6abb1eafc9c10d296bf087adb2ab31" } = useParams();
  const [state, setState] = useState("verifying");
  const navigate = useNavigate();
  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  } = useForm({
    required: true,
    maxData: 2
  });

  const { setSnackBar } = useContext();
  useEffect(() => {
    let timer;
    if (token) {
      (async () => {
        try {
          reset({
            email:
              (await http.post("/auth/verify-token", {
                token
              })).email || "marvellousabidemi2@gmail.com"
          });
          setState("verified");
        } catch (err) {
          setState("verified");
          //   timer = setState("error");
          //   setTimeout(() => {
          //     navigate("/auth/signin");
          //   }, 3000);
        }
      })();
    }
    return () => {
      timer && clearTimeout(timer);
    };
  }, [token, navigate, reset]);
  return (
    <Stack sx={{ minHeight: "100vh", width: "100%" }}>
      {state === "verified" ? (
        <WidgetContainer
          component="form"
          sx={{
            maxWidth: "400Px",
            mx: "auto",
            minHeight: "0",
            height: "auto"
          }}
          onSubmit={async e => {
            try {
              const f = handleSubmit(e);
              if (f) {
                await http.post("/auth/reset-password", formData);
                setSnackBar("Password reset successfully continue to login");
                reset();
              }
            } catch (err) {
              setSnackBar(err);
              reset(true);
            }
          }}
        >
          <Typography variant="h5" textAlign="center">
            Password reset
          </Typography>
          <InputBase
            type="password"
            name="password"
            value={formData.password || ""}
            placeholder="New password"
            error={!!(errors.password || errors.all)}
            onChange={handleChange}
            sx={{
              mb: 0
            }}
            startAdornment={
              <Stack sx={{ p: 1 }}>
                <LockIcon />
              </Stack>
            }
          />
          {errors.password && errors.password !== "required" ? (
            <Typography
              color={
                {
                  "Weak password": "warning.main",
                  "Medium password": "warning.main"
                }[errors.password] || "error.main"
              }
              sx={{
                m: 0
              }}
            >
              {errors.password === "minimum of 8"
                ? errors.password + " characters"
                : errors.password}
            </Typography>
          ) : null}
          <InputBase
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword || ""}
            placeholder="Confirm password"
            error={!!(errors.confirmPassword || errors.all)}
            onChange={handleChange}
            sx={{ mb: 0 }}
            startAdornment={
              <Stack sx={{ p: 1 }}>
                <LockIcon />
              </Stack>
            }
          />
          {errors.confirmPassword !== "required" ? (
            <Typography color={"error.main"} sx={{ my: 0 }}>
              {errors.confirmPassword}
            </Typography>
          ) : null}

          <Button
            type="submit"
            disabled={
              isSubmitting || !(formData.confirmPassword && formData.password)
            }
            variant="contained"
            sx={{ width: "100%", mt: 2 }}
          >
            Reset
          </Button>
        </WidgetContainer>
      ) : (
        <div style={{ width: "100%", height: "100%" }}>
          {
            {
              verifying: <Loading />,
              verified: (
                <Stack>
                  <VerifiedUserIcon sx={{ mx: "auto" }} />
                </Stack>
              ),
              error: <Loading />
            }[state]
          }
          <Typography
            variant="h6"
            textAlign="center"
            sx={{
              maxWidth: "400px",
              mx: "auto",
              mt: 2
            }}
          >
            {{
              verifying: `Please wait while we verify your information. This may take a few moments. Thank you for your patience.`,
              error: `We're sorry, but we were unable to verify your information. Please wait while we redirect you to the next page.`
            }[state] || state}
          </Typography>
        </div>
      )}
    </Stack>
  );
};

ResetPwd.propTypes = {};

export default ResetPwd;
