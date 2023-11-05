import React, { useCallback } from "react";
import PropTypes from "prop-types";
import InfiniteFetch from "libs/InfiniteFetch";
import { useContext } from "context/store";

const InfiniteScroll = React.forwardRef(
  ({ children, handleAction, ...rest }, ref) => {
    const { setSnackBar } = useContext();

    const onDataChange = useCallback(
      props => handleAction && handleAction("data", props),
      [handleAction]
    );

    const onResponse = useCallback(
      (err, data) => {
        if (err) !err.isCancelled && setSnackBar(err.message);
        else {
        }
      },
      [setSnackBar]
    );

    return (
      <InfiniteFetch
        onDataChange={onDataChange}
        onResponse={onResponse}
        {...rest}
        ref={ref}
        key={rest.verify}
      >
        {props => {
          return children(props);
        }}
      </InfiniteFetch>
    );
  }
);

InfiniteScroll.propTypes = {};

export default InfiniteScroll;
