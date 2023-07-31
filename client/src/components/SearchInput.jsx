import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import CustomInput from "components/CustomInput";
import Loading from "components/Loading";

const SearchInput = ({ endAdornment, defaultValue = "", onChange }) => {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const stateRef = useRef({
    hasTyped: false
  });
  const search = (stateRef.current.hasTyped
    ? searchParams.get("search") || defaultValue
    : defaultValue
  ).toLowerCase();

  const handleChange = ({ currentTarget: { value } }) => {
    stateRef.current.hasTyped = true;
    searchParams.set("search", value);
    setSearchParams(searchParams);
    if (onChange) {
      setLoading(true);
      onChange(value, { setLoading });
    }
  };

  return (
    <CustomInput
      standard
      placeholder="Search..."
      value={search}
      onChange={handleChange}
      endAdornment={endAdornment || (loading && <Loading />)}
    />
  );
};

SearchInput.propTypes = {};

export default SearchInput;
