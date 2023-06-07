import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import EmptyData from "components/EmptyData";
const Redirect = ({
  message = `You are not authorized to view this page and will be redirected soon...`,
  fallbackPath = "/"
}) => {
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => {
      navigate(
        window.location.pathname.toLowerCase() === true || true
          ? fallbackPath
          : -1
      );
    }, 5000);
  }, [navigate, fallbackPath]);
  return <EmptyData label={message} />;
};

Redirect.propTypes = {};

export default Redirect;
