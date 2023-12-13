import React, { useState, useEffect, useRef } from "react";
import useForm from "hooks/useForm";
import { Stack, InputBase, Button } from "@mui/material";
import { WidgetContainer, StyledLink, authLayoutSx } from "components/styled";
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
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import man1 from "assets/imgs/man1.jpg";
import woman1 from "assets/imgs/woman1.jpg";
import man2 from "assets/imgs/man2.jpg";
import woman2 from "assets/imgs/woman2.jpg";
import man3 from "assets/imgs/man3.jpeg";
import woman3 from "assets/imgs/woman3.jpeg";
import man4 from "assets/imgs/man4.jpeg";
import woman4 from "assets/imgs/woman4.jpg";
import Loading from "components/Loading";

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

  let redirect = searchParams.get("redirect");
  redirect =
    redirect && redirect.toLowerCase().indexOf("auth") === -1 ? redirect : "";

  useEffect(() => {
    dispatch(signOutUser());
  }, [dispatch]);

  useEffect(() => {
    // onAuthStateChanged(firebaseAuth, (...u) => console.log(u));
  }, []);

  const onSubmit = async (e, formData) => {
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
        case "demo":
          user = (await http.post(url, formData)).data;
          break;
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

      navigate(redirect || "/", prop);
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

  const handleDemoAcc = formData => onSubmit("demo", formData);

  return (
    <>
      <Stack sx={{ minHeight: "100vh", width: "100%" }}>
        <Box sx={authLayoutSx}>
          <WidgetContainer sx={{ mt: 2 }} component="form" onSubmit={onSubmit}>
            <BrandIcon staticFont />
            <CustomInput
              readOnly={isSubmitting}
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
              readOnly={isSubmitting}
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

            <Stack sx={{ mt: "-4px" }}>
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
              {isSubmitting ? <Loading /> : "Submit"}
            </Button>
            <Button
              variant="contained"
              sx={{ width: "100%", mt: 2, py: 1, display: "none" }}
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

          <WidgetContainer sx={{ height: "auto", minHeight: "auto" }}>
            <Box
              component="fieldset"
              sx={{
                border: "1px solid currentColor",
                borderColor: "grey.400",
                color: "primary.main",
                borderRadius: "5px"
              }}
            >
              <legend>Demo Accounts</legend>
              {[
                {
                  image: man1,
                  username: "Joe Bright"
                },
                {
                  image: woman1,
                  username: "Adebayo Opeyemi"
                },
                {
                  image: man2,
                  username: "Ayodeji Adepoju"
                },
                {
                  image: woman2,
                  username: "Elizabeth Johnson"
                },
                {
                  image: man3,
                  username: "Michael Williams"
                },
                {
                  image: woman3,
                  username: "Olamide Akinloye"
                },
                {
                  image: man4,
                  username: "Temiloluwa Ogunsola"
                },
                {
                  image: woman4,
                  username: "Mary Davis"
                }
              ].map((u, i) => {
                const trim = u.username.replace(/\s/, "").toLowerCase();
                return (
                  <Chip
                    key={i}
                    sx={{
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      m: 1
                    }}
                    onClick={() =>
                      isSubmitting
                        ? null
                        : handleDemoAcc({
                            email: trim + "@demo.com",
                            password: "@testUser1"
                          })
                    }
                    avatar={<Avatar alt={u.username} src={u.image} />}
                    label={u.username}
                  />
                );
              })}
            </Box>
            <Typography sx={{ mt: 1, color: "error.main" }}>
              Warning: Anonymous users sharing the same demo account as you can
              POST, DELETE and UPDATE any content. For a personalized
              experience, please signup and login.
            </Typography>
          </WidgetContainer>
        </Box>
      </Stack>
    </>
  );
};

export default Signin;
