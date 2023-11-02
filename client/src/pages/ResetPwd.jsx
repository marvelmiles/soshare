import React from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { WidgetContainer, StyledLink } from "components/styled";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import http from "api/http";
import useForm from "hooks/useForm";
import Button from "@mui/material/Button";
import { useContext } from "context/store";
import LockIcon from "@mui/icons-material/Lock";
import CustomInput from "components/CustomInput";

const ResetPwd = props => {
  const { token, userId } = useParams();
  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    isInValid,
    reset
  } = useForm({
    required: {
      password: "Password is required",
      confirmPassword: "Confirm password is required"
    },
    maxData: 2
  });

  const { setSnackBar } = useContext();

  return (
    <Stack sx={{ minHeight: "100vh", width: "100%" }}>
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
              await http.post(
                `/auth/reset-password/${token}/${userId}`,
                formData,
                {
                  _noRefresh: true
                }
              );
              setSnackBar({
                message: (
                  <span>
                    Password reset successfully. You can{" "}
                    <StyledLink to="/auth/signin">login</StyledLink>
                  </span>
                ),
                severity: "success"
              });
              reset();
            }
          } catch (err) {
            !err.isCancelled && setSnackBar(err.message);
            reset(true);
          }
        }}
      >
        <Typography variant="h5" textAlign="center">
          Password reset
        </Typography>
        <CustomInput
          type="password"
          name="password"
          value={formData.password}
          label="New password"
          onChange={handleChange}
          error={errors.password}
          sx={{
            my: 2
          }}
          startAdornment={
            <Stack sx={{ p: 1 }}>
              <LockIcon />
            </Stack>
          }
        />
        <CustomInput
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          label="Confirm password"
          error={errors.confirmPassword}
          onChange={handleChange}
          startAdornment={
            <Stack sx={{ p: 1 }}>
              <LockIcon />
            </Stack>
          }
        />

        <Button
          type="submit"
          disabled={isSubmitting || isInValid}
          variant="contained"
          sx={{ width: "100%", mt: 2, mb: 1 }}
        >
          Reset
        </Button>

        <StyledLink
          sx={{ textAlign: "center", width: "100%" }}
          to={"/auth/verification-mail"}
        >
          Get reset token!
        </StyledLink>
      </WidgetContainer>
    </Stack>
  );
};

ResetPwd.propTypes = {};

export default ResetPwd;
