import React, { useRef } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import MoreActions from "components/MoreActions";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Skeleton from "@mui/material/Skeleton";
import IconButton from "@mui/material/IconButton";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

const ShortSidebar = ({
  id,
  user,
  handleAction,
  loading,
  animation,
  muted,
  withVolume = true
}) => {
  const stateRef = useRef({
    document: {
      id,
      user
    },
    moreUrls: {
      delPath: `/shorts`,
      idOnly: true
    }
  });

  return (
    <Box
      sx={{
        height: "10px",
        width: "100%",
        position: "absolute",
        top: "16px",
        left: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 1
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
        <IconButton
          sx={
            withVolume
              ? undefined
              : { visibility: "hidden", pointerEvents: "none" }
          }
          onClick={e => {
            e.stopPropagation();
            handleAction("toggle-mute", { value: muted });
          }}
        >
          {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      )}
      {loading ? (
        <Skeleton
          variant="circular"
          width={30}
          height={30}
          animation={animation}
        />
      ) : (
        <MoreActions
          docType="short"
          handleAction={handleAction}
          document={stateRef.current.document}
          Icon={MoreVertIcon}
          title="short"
          urls={stateRef.current.moreUrls}
          nullifyEdit
          // btnSx={
          //   miniShort && { position: "absolute", top: "-10px", right: "8px" }
          // }
        />
      )}
    </Box>
  );
};

ShortSidebar.propTypes = {};

export default ShortSidebar;
