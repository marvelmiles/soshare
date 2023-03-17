import React, { useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import MoreActions from "components/MoreActions";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const ShortSidebar = ({ id, isOwner, user, handleAction }) => {
  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: "8px",
          right: "16px",
          color: "#fff"
        }}
      >
        <MoreActions
          handleAction={handleAction}
          composeDoc={{
            id,
            user
          }}
          isOwner={isOwner}
          Icon={MoreVertIcon}
          title="short"
          urls={{
            delPath: `/shorts/${id}`
          }}
          btnSx={{
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent)",
            // mixBlendMode: "multiply",
            color: "#fff !important",
            "& > *": {
              fill: "#fff !important"
            }
          }}
        />
      </Box>
    </>
  );
};

ShortSidebar.propTypes = {};

export default ShortSidebar;
