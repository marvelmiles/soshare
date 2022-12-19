import React, { useState, useEffect } from "react";
import useForm from "hooks/useForm";
import { Stack, InputBase, Button } from "@mui/material";
import { WidgetContainer, StyledLink } from "components/styled";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { signInWithPopup } from "@firebase/auth";
import { auth, provider } from "api/firebase";
import http from "api/http";
import { useDispatch } from "react-redux";
import { loginUser } from "redux/userSlice";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../redux/userSlice";
import { useContext } from "../redux/store";

const Signin = () => {
  const {
    handleSubmit,
    handleChange,
    isSubmitting,
    reset,
    formData,
    errors
  } = useForm({
    placeholders: {
      placeholder: "",
      password: ""
    }
  });
  const { setSnackBar } = useContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  const handleLogin = async e => {
    e.target && e.preventDefault();
    try {
      let user;
      reset("submitting");
      switch (e) {
        case "google":
          user = (await signInWithPopup(auth, provider)).user;
          user = await http.post("/auth/signin", {
            username: user.displayName,
            displayName: user.displayName,
            email: user.email,
            photoUrl: user.photoURL,
            phoneNumber: user.phoneNumber,
            provider: e
          });
          break;
        default:
          if (handleSubmit()) user = await http.post("/auth/signin", formData);
          else return;
          break;
      }
      dispatch(loginUser(user));
      navigate("/");
    } catch (message) {
      reset(true);
      message && setSnackBar(message);
    }
  };

  return (
    <>
      <Stack sx={{ minHeight: "100vh", width: "100%" }}>
        <WidgetContainer sx={{ maxWidth: "576px", mx: "auto" }}>
          <InputBase
            name="placeholder"
            placeholder="Email or username"
            value={formData.placeholder}
            onChange={handleChange}
            error={!!errors.placeholder}
          />
          <InputBase
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
          />
          <Stack>
            <FormControlLabel
              control={<Checkbox onChange={(_, bool) => console.log(bool)} />}
              label="Remember Me"
            />
            <StyledLink>Recovery password</StyledLink>
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
        </WidgetContainer>
      </Stack>
    </>
  );
};

export default Signin;

// cid = 1690552f337b85474f59c7e8bb25b8cc
// client secret = 115cad1e54b832e2612012619c735459
