import React, { useRef } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import MoreActions from "components/MoreActions";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Skeleton from "@mui/material/Skeleton";

const ShortSidebar = ({ id, user, handleAction, loading, animation }) => {
  const stateRef = useRef({
    document: {
      id,
      user
    },
    moreUrls: {
      delPath: `/shorts`
    }
  });
  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: "8px",
          right: "16px",
          "*": {
            color: "common.white"
          },
          "& > *": {
            backgroundColor: "common.blend",
            "&:hover": {
              backgroundColor: "common.blendHover"
            }
          }
        }}
      >
        {loading ? (
          <Skeleton
            variant="circular"
            width={30}
            height={30}
            animation={animation}
          />
        ) : (
          <MoreActions
            handleAction={handleAction}
            document={stateRef.current.document}
            Icon={MoreVertIcon}
            title="short"
            urls={stateRef.current.moreUrls}
            nullifyEdit
          />
        )}
      </Box>
    </>
  );
};

ShortSidebar.propTypes = {};

export default ShortSidebar;
