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
  rows = multiline ? 1 : 0,
  type = "text",
  readOnly,
  standard,
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
      className="custom-input"
      sx={{
        position: "relative",
        mb: standard ? 0 : undefined,
        mt: standard && label ? "24px" : 0,
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
                "Weak password": "error.main",
                "Medium password": "divider"
              }[error] || "error.dark"
            : "divider",
          borderRadius: "5px",
          transition: "all 0.2s ease-out",
          p: "4px",
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
              fontSize: standard ? "14px" : "12.5px"
            },
            "& > div.custom-input-content": {
              display: "block",
              position: standard ? undefined : "relative",
              paddingTop: standard ? "" : "20px",
              minHeight: multiline && rows ? `${22 + 16 * rows}px` : "", // row=22 + textLabel=16
              [INPUT_AUTOFILL_SELECTOR]: standard
                ? undefined
                : {
                    "& + span": spanSxOnInput,
                    content: '"autofill"'
                  },
              ".custom-input": {
                outline: 0,
                border: 0,
                width: "100%",
                width: "100%",
                py: standard ? 1 : 0,
                "&,&::placeholder": {
                  color: "text.primary"
                },
                "&:focus": standard
                  ? undefined
                  : {
                      "& + span": spanSxOnInput
                    }
              },

              ".label": {
                transition: "all 0.2s ease-out",
                pointerEvents: "none",
                fontWeight: "normal",
                position: "absolute",
                left: 0,
                top: standard ? "-15px" : "55%",
                transform: "translateY(-50%)",
                "& > span": {
                  color: "error.dark"
                },
                ...(value.length ? spanSxOnInput : undefined)
              }
            },
            "& > span": {
              float: "right",
              mb: "3.5px"
            }
          },
          "& > div": {
            mt: standard ? 0 : "4px",
            "& svg:not(.input-svg-container svg,.custom-loading svg)": {
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
                {...props}
                rows={rows}
                value={value}
                type={type}
                className={`custom-input ${props.className || ""}`}
              />
            ) : (
              <input
                readOnly={readOnly}
                {...props}
                value={value}
                type={type}
                className={`custom-input ${props.className || ""}`}
              />
            )}
            <Typography component="span" className="label" variant="h5">
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

      {value && typeof error === "string" ? (
        <Typography
          color={
            error
              ? {
                  "Weak password": "error.dark",
                  "Medium password": "success.main"
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
