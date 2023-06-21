import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { INPUT_AUTOFILL_SELECTOR } from "theme";

const CustomInput = ({
  error,
  required = false,
  endAdornment,
  startAdornment,
  multiline,
  label,
  value = "",
  sx,
  ...props
}) => {
  const spanSxOnInput = {
    fontSize: "12px",
    transform: "none",
    top: "3.5px",
    color: "primary.main"
  };
  return (
    <Box
      sx={{
        my: 1,
        ...sx
      }}
    >
      <Box
        sx={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          border: "1px solid currentColor",
          borderColor: error
            ? {
                "Weak password": "divider",
                "Medium password": "divider"
              }[error] || "error.dark"
            : "divider",
          borderRadius: "5px",
          transition: "all 0.2s ease-out",
          px: "4px",
          gap: "4px",
          "&:focus-within": {
            borderColor: error
              ? {
                  "Weak password": "primary.main",
                  "Medium password": "primary.main"
                }[error] || "error.dark"
              : "primary.main"
          },
          "& > label": {
            flex: 1,
            cursor: props.readOnly ? "normal" : "pointer",
            pl: startAdornment ? 0 : 1,
            pr: endAdornment ? 0 : 1,
            minHeight: 0,
            height: "auto",
            "& *": {
              fontSize: "12.5px"
            },
            "& > div.custom-input-content": {
              display: "block",
              position: "relative",
              padding: "20px  0",
              minHeight:
                multiline && props.rows ? `${22 + 16 * props.rows}px` : "", // row=22 + textLabel=16
              "& > *": {
                position: "absolute",
                width: "100%",
                display: "block"
              },

              [INPUT_AUTOFILL_SELECTOR]: {
                "& + span": spanSxOnInput
              },
              ".custom-input": {
                outline: 0,
                border: 0,
                width: "100%",
                color: "text.primary",
                [`&:focus${
                  value.length
                    ? props.readOnly
                      ? ",&:not(.custom-input-invalidate)"
                      : ",&:valid"
                    : props.readOnly
                    ? "&:not(:empty)"
                    : ""
                }`]: {
                  "& + span": spanSxOnInput
                }
              },

              span: {
                transition: "all 0.2s ease-out",
                pointerEvents: "none",
                fontWeight: "normal",
                "& > span": {
                  color: "error.dark"
                },
                top: "55%",
                transform: "translateY(-50%)",
                ...(value.length ? spanSxOnInput : undefined)
              }
            },
            "& > span": {
              float: "right",
              mb: "3.5px"
            }
          },
          "& > div": {
            mt: "4px",
            "& svg:not(.input-svg-container svg)": {
              color: "text.primary"
            },
            "& *": {
              m: 0
            }
          }
        }}
      >
        {startAdornment ? <div>{startAdornment}</div> : null}
        <label htmlFor={props.id} className="custom-input-container">
          <div className="custom-input-content">
            {multiline ? (
              <textarea
                rows={1}
                value={value}
                {...props}
                className={`custom-input ${props.className || ""}`}
              />
            ) : (
              <input
                value={value}
                {...props}
                className={`custom-input ${props.className || ""}`}
              />
            )}
            <Typography component="span" variant="h5">
              {label} {required ? <span>*</span> : null}
            </Typography>
          </div>
          {props["data-max"] ? (
            <Typography component="span" variant="caption">
              {value.length} / {props["data-max"]}
            </Typography>
          ) : null}
        </label>
        {endAdornment ? <div>{endAdornment}</div> : null}
      </Box>
      {error !== "required" && typeof error === "string" ? (
        <Typography
          color={
            error
              ? {
                  "Weak password": "warning.light",
                  "Medium password": "warning.light"
                }[error] || "error.dark"
              : "transparent"
          }
          variant="caption"
        >
          {error}
        </Typography>
      ) : null}
    </Box>
  );
};

CustomInput.propTypes = {};

export default CustomInput;
