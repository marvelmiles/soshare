import React, { useState, useEffect, useRef } from "react";
import useForm from "hooks/useForm";
import { Stack, InputBase, Button } from "@mui/material";
import { WidgetContainer, StyledLink } from "components/styled";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { signInWithPopupTimeout, auth as firebaseAuth } from "api/firebase";
import http from "api/http";
import { useDispatch } from "react-redux";
import { signInUser, signOutUser } from "context/slices/userSlice";
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
import BrandIcon from "components/BrandIcon";
import { HTTP_CODE_INVALID_USER_ACCOUNT } from "context/constants";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";

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
  const { setSnackBar, locState } = useContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const stateRef = useRef({
    rememberMe: "true",
    validateTypeMap: {}
  });

  let redirect = searchParams.get("redirect") || "";
  redirect =
    redirect.toLowerCase().indexOf(encodeURIComponent("/auth/signup")) > -1
      ? ""
      : redirect;

  useEffect(() => {
    dispatch(signOutUser());
  }, [dispatch]);

  useEffect(() => {
    onAuthStateChanged(firebaseAuth, (...u) => console.log(u));
  }, []);

  const onSubmit = async e => {
    if (e.target) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      let user;
      reset(true, { isSubmitting: true });
      const url = `/auth/signin?rememberMe=${stateRef.current.rememberMe ||
        ""}`;
      switch (e) {
        case "google":
          user = (await signInWithPopupTimeout()).user;
          user = (await http.post(url, {
            username: user.displayName,
            displayName: user.displayName,
            email: user.email,
            photoUrl: user.photoURL,
            phoneNumber: user.phoneNumber,
            provider: e
          })).data;
          break;
        default:
          if (
            handleSubmit(undefined, {
              validateTypeMap: stateRef.current.validateTypeMap
            })
          )
            user = (await http.post(url, formData)).data;
          else return;
          break;
      }

      dispatch(signInUser(user));

      locState.from = 0;

      const prop = {
        state: locState
      };

      if (redirect) redirect = redirect.replace(/cv/, "view");

      // navigate(redirect || "/", prop);
    } catch (err) {
      if (err.code) {
        if (err.code === "auth/popup-closed-by-user")
          err.message = "Authentication popup closed by you!";
        (async () => {
          const res = await getRedirectResult(firebaseAuth);
          console.log(res);
        })();
      }

      reset(true);

      if (err.code === HTTP_CODE_INVALID_USER_ACCOUNT)
        stateRef.current.email = false;

      err && setSnackBar(err.message);
    }
  };

  const onChange = e => {
    if (e.target.dataset.changed === "false")
      stateRef.current.validateTypeMap[e.target.name] = e.target.type;
    else if (stateRef.current.validateTypeMap[e.target.name])
      delete stateRef.current.validateTypeMap[e.target.name];
    handleChange(e);
  };

  return (
    <>
      <Stack sx={{ minHeight: "100vh", width: "100%" }}>
        <WidgetContainer
          sx={{ maxWidth: "576px", mx: "auto" }}
          component="form"
          onSubmit={onSubmit}
        >
          <BrandIcon staticFont />
          <CustomInput
            name="placeholder"
            label="Email or username"
            value={formData.placeholder || ""}
            onChange={onChange}
            error={!!(errors.placeholder || errors.all)}
            data-changed={!!formData.placeholder}
            sx={{ my: 2 }}
            startAdornment={
              <IconButton
                sx={{
                  "&:hover": {
                    background: "none"
                  }
                }}
              >
                <AccountBoxIcon sx={{ cursor: "unset" }} />
              </IconButton>
            }
          />
          <CustomInput
            type={showPwd ? "text" : "password"}
            name="password"
            label="Password"
            autoComplete="pass testUser4"
            value={formData.password || ""}
            onChange={onChange}
            error={errors.password}
            data-validate-type={"false"}
            data-min={8}
            data-changed={!!formData.password}
            startAdornment={
              <IconButton
                sx={{
                  "&:hover": {
                    background: "none"
                  }
                }}
              >
                <LockIcon sx={{ cursor: "unset" }} />
              </IconButton>
            }
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
                  onChange={(_, bool) => (stateRef.current.rememberMe = bool)}
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
                stateRef.current.email !== false &&
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
            sx={{ width: "100%", mt: 2, py: 1 }}
            type="submit"
            disabled={isSubmitting}
          >
            Sigin
          </Button>
          <Button
            variant="contained"
            sx={{ width: "100%", mt: 2, py: 1 }}
            onClick={() => onSubmit("google")}
            disabled={isSubmitting}
          >
            Continue with Google
          </Button>
          <Typography textAlign="center" mt={1}>
            Don't have an account?{" "}
            <StyledLink
              to={`/auth/signup?${
                redirect
                  ? `redirect=${encodeURIComponent(
                      createRelativeURL("view redirect")
                    )}`
                  : ""
              }`}
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
