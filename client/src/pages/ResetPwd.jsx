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
    reset
  } = useForm({
    required: true,
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
                  _noRefresh: true,
                  _rejectAll: true
                }
              );
              setSnackBar({
                message: (
                  <span>
                    Password reset successfully. You can{" "}
                    <StyledLink to="/auth/signin">login</StyledLink>
                  </span>
                )
              });
              reset();
            }
          } catch (err) {
            err && setSnackBar(err);
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
            mb: 0
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
          sx={{ mb: 0 }}
          startAdornment={
            <Stack sx={{ p: 1 }}>
              <LockIcon />
            </Stack>
          }
        />

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
    </Stack>
  );
};

ResetPwd.propTypes = {};

export default ResetPwd;
