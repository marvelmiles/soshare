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
  sx,
  ...props
}) => {
  return (
    <div>
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
          mb: 1,
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
            "& > div.custom-input-content": {
              display: "block",
              position: "relative",
              padding: "28px 0",
              minHeight:
                multiline && props.rows ? `${18 + 16 + 22 * props.rows}px` : "", // row=22 + label=16 + contheight=56 - top-fontsize
              "& > *": {
                position: "absolute",
                width: "100%",
                display: "block"
              },
              ".custom-input": {
                outline: 0,
                border: 0,
                width: "100%",
                bottom: 5,
                caretColor: "text.primary",
                color: "text.primary",
                fontSize: 18,
                [`&:focus${
                  props.value.length
                    ? props.readOnly
                      ? ",&:not(.custom-input-invalidate)"
                      : ",&:valid"
                    : props.readOnly
                    ? "&:not(:empty)"
                    : ""
                }`]: {
                  "& + span": {
                    fontSize: "12px",
                    transform: "none",
                    top: "8px",
                    color: "primary.main"
                  }
                }
              },

              [INPUT_AUTOFILL_SELECTOR]: {
                "& + span": {
                  fontSize: "12px",
                  transform: "none",
                  top: "8px",
                  color: "primary.main"
                }
              },
              span: {
                transition: "all 0.2s ease-out",
                pointerEvents: "none",
                top: "18px",
                color: "text.primary",
                fontWeight: "normal",
                "& > span": {
                  color: "error.dark"
                }
              }
            },
            "& > span": {
              textAlign: "right",
              float: "right"
            }
          },
          "& > div": {
            px: 1
          },
          ...sx
        }}
        // Jzkr2d
        // 08025934773
        // 09164130918
        // 07025326543
      >
        {startAdornment ? <div>{startAdornment}</div> : null}
        <label htmlFor={props.id} className="custom-input-container">
          <div className="custom-input-content">
            {multiline ? (
              <textarea
                rows={1}
                {...props}
                className={`custom-input ${props.className || ""}`}
              />
            ) : (
              <input {...props} className={`custom-input ${props.className}`} />
            )}
            <Typography component="span" variant="h5">
              {label} {required ? <span>*</span> : null}
            </Typography>
          </div>
          {props["data-max"] ? (
            <Typography component="span" variant="caption">
              {props.value.length} / {props["data-max"]}
            </Typography>
          ) : null}
        </label>
        {endAdornment ? <div>{endAdornment}</div> : null}
      </Box>

      {typeof error === "string" ? (
        <Typography
          color={
            error
              ? {
                  "Weak password": "warning.light",
                  "Medium password": "warning.light"
                }[error] || "error.dark"
              : "transparent"
          }
          variant="subtitle2"
          sx={{
            mt: "-8px"
          }}
        >
          {{
            required: `Field is required`,
            [`minimum of ${props["data-min"]}`]: `minimum of 8 characters`
          }[error] || error}
        </Typography>
      ) : null}
    </div>
  );
};

CustomInput.propTypes = {};

export default CustomInput;
