import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import CustomInput from "components/CustomInput";
import Loading from "components/Loading";
import { useContext } from "context/store";
import { createRelativeURL } from "api/http";
import { debounce } from "@mui/material";

const withDebounceFn = debounce(cb => cb(), 0);

const SearchInput = ({
  endAdornment,
  defaultValue = "",
  onChange,
  ...props
}) => {
  const [loading, setLoading] = useState(false);

  const { locState } = useContext();

  const [value, setValue] = useState(
    new URLSearchParams(window.location.search).get("search") || defaultValue
  );

  const navigate = useNavigate();

  const stateRef = useRef({
    setDefaultValue() {
      value &&
        navigate(createRelativeURL(`search`, `search=${value}`), {
          state: locState,
          replace: true
        });
    }
  });

  useEffect(() => {
    stateRef.current.setDefaultValue();
  }, []);

  const handleChange = ({ currentTarget: { value } }) => {
    setValue(value);
    // using debounce prevent hook update limit error
    withDebounceFn(() => {
      navigate(createRelativeURL(`search`, `search=${value}`), {
        replace: true,
        state: locState
      });
    });
    if (onChange) {
      setLoading(true);
      onChange(value, { setLoading });
    }
  };

  return (
    <CustomInput
      {...props}
      standard
      placeholder="Search..."
      value={value}
      onChange={handleChange}
      endAdornment={endAdornment || (loading && <Loading />)}
    />
  );
};

SearchInput.propTypes = {};

export default SearchInput;
