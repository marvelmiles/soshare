import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import EmptyData from "components/EmptyData";
import Loading from "components/Loading";
import { useContext } from "context/store";

const Redirect = ({
  message = `You are not authorized to view this page and will be redirected soon...`,
  fallbackPath = "/",
  to = -1,
  delay = 5000
}) => {
  const { prevPath } = useContext();
  const navigate = useNavigate();
  useEffect(() => {
    const id = setTimeout(() => {
      navigate(
        to === -1 ? (prevPath === "/auth/signin" ? fallbackPath : -1) : to
      );
      clearTimeout(id);
    }, delay);
  }, [navigate, fallbackPath, delay, to, prevPath]);
  return (
    <EmptyData
      label={
        <div>
          {message}
          <Loading sx={{ mt: 3 }} size={40} />
        </div>
      }
    />
  );
};

Redirect.propTypes = {};

export default Redirect;
