import React, { useState, useEffect, useRef } from "react";
import useForm from "hooks/useForm";
import { Stack, InputBase, Button } from "@mui/material";
import { WidgetContainer, StyledLink } from "components/styled";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { signInWithPopupTimeout } from "api/firebase";
import http from "api/http";
import { useDispatch } from "react-redux";
import { loginUser, logoutUser } from "context/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { useContext } from "context/store";
import { useSearchParams } from "react-router-dom";
import Typography from "@mui/material/Typography";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import LockIcon from "@mui/icons-material/Lock";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import CustomInput from "components/CustomInput";
import { createRelativeURL } from "api/http";

InputBase.defaultProps = {
  value: ""
};
const Signin = () => {
  const {
    handleSubmit,
    handleChange,
    isSubmitting,
    reset,
    formData,
    errors
  } = useForm({
    required: {
      placeholder: true,
      password: true
    }
  });
  const [searchParams] = useSearchParams();
  const { setSnackBar } = useContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const stateRef = useRef({
    rememberMe: "true"
  }).current;
  useEffect(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  const handleLogin = async e => {
    if (e.target) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      let user;
      reset(true, { isSubmitting: true });
      const url = `/auth/signin?rememberMe=${stateRef.rememberMe || ""}`;
      switch (e) {
        case "google":
          user = (await signInWithPopupTimeout()).user;
          user = await http.post(url, {
            username: user.displayName,
            displayName: user.displayName,
            email: user.email,
            photoUrl: user.photoURL,
            phoneNumber: user.phoneNumber,
            provider: e
          });
          break;
        default:
          if (handleSubmit()) user = await http.post(url, formData);
          else return;
          break;
      }
      dispatch(loginUser(user));
      const redirect = decodeURIComponent(searchParams.get("redirect") || "");
      navigate(redirect || "/");
    } catch (message) {
      console.log(message);
      if (message.code) {
        if (message.code === "auth/popup-closed-by-user")
          message = "Authentication popup closed by you!";
        else message = "Something went wrong!";
      }
      reset(true);
      if (message === "Account is not registered") stateRef.email = false;
      message && setSnackBar(message);
    }
  };
  return (
    <>
      <Stack sx={{ minHeight: "100vh", width: "100%" }}>
        <WidgetContainer sx={{ maxWidth: "576px", mx: "auto" }}>
          <CustomInput
            name="placeholder"
            label="Email or username"
            value={formData.placeholder || ""}
            onChange={handleChange}
            error={!!(errors.placeholder || errors.all)}
            sx={{ my: 2 }}
            startAdornment={<AccountBoxIcon sx={{ cursor: "unset" }} />}
          />
          <CustomInput
            type={showPwd ? "text" : "password"}
            name="password"
            label="Password"
            value={formData.password || ""}
            onChange={handleChange}
            error={errors.password}
            data-validate-type={"false"}
            data-min={8}
            startAdornment={<LockIcon sx={{ cursor: "unset" }} />}
            endAdornment={
              <IconButton onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            }
          />

          <Stack sx={{ mt: "-8px" }}>
            <FormControlLabel
              disabled={isSubmitting}
              control={
                <Checkbox
                  defaultChecked
                  onChange={(_, bool) => (stateRef.rememberMe = bool)}
                />
              }
              label="Remember Me"
              sx={{
                ".MuiFormControlLabel-label": {
                  color: "primary.main"
                }
              }}
            />
            <StyledLink
              state={
                stateRef.email !== false &&
                formData.placeholder && {
                  user: {
                    email: formData.placeholder
                  }
                }
              }
              to="/auth/verification-mail"
            >
              Reset password
            </StyledLink>
          </Stack>
          <Button
            variant="contained"
            sx={{ width: "100%", mt: 2 }}
            onClick={handleLogin}
            disabled={isSubmitting}
          >
            Sigin
          </Button>
          <Button
            variant="contained"
            sx={{ width: "100%", mt: 2 }}
            onClick={() => handleLogin("google")}
            disabled={isSubmitting}
          >
            Continue with Google
          </Button>
          <Typography textAlign="center" mt={1}>
            Don't have an account?{" "}
            <StyledLink
              to={`/auth/signup?redirect=${encodeURIComponent(
                createRelativeURL()
              )}`}
            >
              signup!
            </StyledLink>
          </Typography>
        </WidgetContainer>
      </Stack>
    </>
  );
};

export default Signin;
