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
  ...props
}) => {
  multiline = false;
  rows = 0;
  const spanSxOnInput = {
    fontSize: "12px",
    transform: "none",
    top: multiline ? "-10px" : "-10px",
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
          border: "1px solid red",
          display: "flex",
          flexDirection: "column",
          pb: 1,
          ".custom-input-container": {
            width: "100%",
            display: "flex",
            ".custom-input-content": {
              flex: 1,
              position: "relative",
              // border: "1px solid purple",
              "div.label": {
                position: "absolute",
                top: "12px"
              },
              ".custom-input": {
                pt: 3,
                width: "100%",
                outline: 0,
                border: 0,
                "&:focus": {
                  "& + .label": {
                    top: "4px"
                  }
                }
              }
            },
            "& > div": {
              alignSelf: "center"
            }
          },
          ".counter": {
            alignSelf: "flex-end",
            border: "1px solid red"
          }
        }}
      >
        <Box className="custom-input-container">
          {startAdornment ? (
            <div className="adornment start-adornment">{startAdornment}</div>
          ) : null}
          <label htmlFor={props.id} className="custom-input-content">
            {multiline ? (
              <textarea
                rows={rows}
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
            <div className="label">
              {label} {required ? <span>*</span> : null}
            </div>
          </label>
          {endAdornment ? (
            <div className="adornment end-adornment">{endAdornment}</div>
          ) : null}
        </Box>
        {props["data-max"] || 10 ? (
          <div className="counter">
            {value.length} / {props["data-max"] || 10}
          </div>
        ) : null}
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

// sx={{
//           display: "flex",
//           flex: 1,
//           border: "1px solid currentColor",
//           borderColor: error
//             ? {
//                 "Weak password": "divider",
//                 "Medium password": "divider"
//               }[error] || "error.dark"
//             : "divider",
//           borderRadius: "5px",
//           transition: "all 0.2s ease-out",
//           px: "4px",
//           // pt: "12px",
//           minHeight: multiline ? `${18 * rows + 22}px` : `${24 * 1 + 22}px`, // row=22 + textLabel=18
//           border: "1px solid green",
//           "&:focus-within": {
//             borderColor: error
//               ? {
//                   "Weak password": "primary.main",
//                   "Medium password": "primary.main"
//                 }[error] || "error.dark"
//               : "primary.main"
//           },
//           "& > label.custom-input-container": {
//             flex: 1,
//             cursor: props.readOnly ? "normal" : "pointer",
//             pl: startAdornment ? 0 : 1,
//             pr: endAdornment ? 0 : 1,
//             position: "relative",
//             display: "flex",
//             flexDirection: "column",
//             // py: 1,
//             // border: "1px solid red",
//             "div.counter": {
//               alignSelf: "flex-end"
//             },
//             "& > div.custom-input-content": {
//               position: "relative",
//               height: "100%",
//               top: multiline ? "5px" : 0,
//               width: "100%",
//               [INPUT_AUTOFILL_SELECTOR]: {
//                 "& + div.label": spanSxOnInput
//               },
//               "& > *": {
//                 position: "absolute",
//                 top: multiline ? "0px" : "50%",
//                 transform: multiline ? "none" : "translateY(-50%)"
//               },
//               ".custom-input": {
//                 height: "clac(100% - 0px)",
//                 outline: 0,
//                 border: 0,
//                 width: "100%",
//                 color: "text.primary",
//                 [`&:focus`]: {
//                   "& + div.label": spanSxOnInput
//                 }
//                 // border: "1px solid blue"
//               },
//               "div.label": {
//                 transition: "all 0.2s ease-out",
//                 pointerEvents: "none",
//                 fontSize: "14px",
//                 "& > span": {
//                   color: "error.dark"
//                 },
//                 ...(value.length ? spanSxOnInput : undefined)
//               }
//             }
//           },
//           "& > div": {
//             // position: "relative",
//             // // mt: "-5px",
//             // alignSelf: multiline ? "flex-start" : "flex-end",

//             "& svg:not(.input-svg-container svg)": {
//               color: "text.primary"
//             },
//             "& *": {
//               m: 0
//             }
//           }
//         }}
