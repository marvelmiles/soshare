import React, { useState, useEffect, useRef } from "react";
import useForm from "hooks/useForm";
import { Stack, InputBase, Button } from "@mui/material";
import { WidgetContainer, StyledLink, StyledButton } from "components/styled";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { signInWithPopup } from "@firebase/auth";
import { auth, provider } from "api/firebase";
import http from "api/http";
import { useDispatch } from "react-redux";
import { loginUser } from "redux/userSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../redux/userSlice";
import { useContext } from "../redux/store";
import { useSearchParams } from "react-router-dom";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
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
  const loc = useLocation();
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
          user = (await signInWithPopup(auth, provider)).user;
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
          console.log(formData);
          if (handleSubmit()) user = await http.post(url, formData);
          else return;
          break;
      }
      // console.log(user.socials, "user socials...");
      dispatch(loginUser(user));
      const redirect = searchParams.get("redirect_url");
      if (redirect) window.location.href = redirect;
      else
        navigate("/", {
          state: {
            from: "signin"
          }
        });
    } catch (message) {
      reset(true);
      if (message === "Account is not registered") stateRef.email = false;
      message && setSnackBar(message);
    }
  };
  // console.log(errors, isSubmitting, formData, " is sub");
  return (
    <>
      <Stack sx={{ minHeight: "100vh", width: "100%" }}>
        <WidgetContainer sx={{ maxWidth: "576px", mx: "auto" }}>
          <InputBase
            name="placeholder"
            placeholder="Email or username"
            value={formData.placeholder || ""}
            onChange={handleChange}
            error={!!(errors.placeholder || errors.all)}
            sx={{ mb: 0 }}
            startAdornment={
              <Stack sx={{ p: 1 }}>
                <AccountBoxIcon />
              </Stack>
            }
          />
          <InputBase
            type={showPwd ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password || ""}
            onChange={handleChange}
            error={errors.password === "required"}
            inputProps={{
              "data-min": "8"
            }}
            sx={{ mb: 0 }}
            startAdornment={
              <Stack sx={{ p: 1 }}>
                <LockIcon />
              </Stack>
            }
            endAdornment={
              <IconButton
                sx={{
                  mr: "4px",
                  backgroundColor: "transparent"
                }}
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            }
          />

          <Stack>
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
          <StyledButton
            variant="contained"
            sx={{ width: "100%", mt: 2 }}
            onClick={handleLogin}
            disabled={isSubmitting}
          >
            Sigin
          </StyledButton>
          <StyledButton
            variant="contained"
            sx={{ width: "100%", mt: 2 }}
            onClick={() => handleLogin("google")}
            disabled={isSubmitting}
          >
            Continue with Google
          </StyledButton>
          <Typography textAlign="center" mt={1}>
            Don't have an account?{" "}
            <StyledLink to="/auth/signup">signup!</StyledLink>
          </Typography>
        </WidgetContainer>
      </Stack>
    </>
  );
};

export default Signin;

// cid = 1690552f337b85474f59c7e8bb25b8cc
// client secret = 115cad1e54b832e2612012619c735459
