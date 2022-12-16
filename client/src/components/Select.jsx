import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import InputBase from "@mui/material/InputBase";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

const Select = ({ open, readOnly = true, onClick }) => {
  return (
    <>
      <Stack
        sx={{
          border: "1px solid #333",
          borderColor: "divider",
          borderRadius: 1
        }}
      >
        <InputBase sx={{ m: 0, border: "none" }} readOnly={readOnly} />
        {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      </Stack>
    </>
  );
};

Select.propTypes = {};

export default Select;
