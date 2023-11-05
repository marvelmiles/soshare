import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import EmptyData from "components/EmptyData";
import Loading from "components/Loading";
import { useContext } from "context/store";

const Redirect = ({
  message = `You are not allowed to view this page and will be redirected soon...`,
  to,
  fallbackPath = "/",
  delay = 3000
}) => {
  const navigate = useNavigate();
  const { withBackBtn, locState } = useContext();
  useEffect(() => {
    const id = setTimeout(() => {
      navigate(
        withBackBtn ? to || locState.from || fallbackPath : fallbackPath,
        {
          replace: true,
          state: {
            ...locState,
            from: window.location.pathname
          }
        }
      );
      clearTimeout(id);
    }, delay);
    return () => clearTimeout(id);
  }, [navigate, delay, to, withBackBtn, fallbackPath, locState]);
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
