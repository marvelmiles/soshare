import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import NorthIcon from "@mui/icons-material/North";
import Button from "@mui/material/Button";
import AvatarGroup from "@mui/material/AvatarGroup";
import Avatar from "@mui/material/Avatar";
import ReactDom from "react-dom";
import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { isDOMElement } from "utils/validators";
import { handleScrollUp } from "utils";

Avatar.defaultProps = {
  sx: {
    width: 25,
    height: 25,
    fontSize: "12px"
  }
};

const DataNotifier = ({
  data,
  message = "Soshared",
  open,
  sx,
  containerRef,
  yCoords = 100,
  position,
  closeNotifier
}) => {
  const [portal, setPortal] = useState(null);
  useEffect(() => {
    const node = containerRef
      ? containerRef.current || containerRef
      : document.documentElement;

    // const data = [
    //   {
    //     url: "sss",
    //     username: "sssssssssssssssssss",
    //     photoUrl: "s"
    //   }
    // ];

    if (isDOMElement(node))
      setPortal(
        ReactDom.createPortal(
          <Button
            variant="contained"
            sx={{
              zIndex: "modal",
              borderRadius: "32px",
              minWidth: "0px",
              width: "250px",
              flexWrap: "wrap",
              gap: 1,
              left: "50%",
              top: 0,
              transition: `transform 0.3s ease-out`,
              transform: `translate(-50%,${open ? yCoords : -(yCoords * 2)}px)`,
              position:
                position ||
                (node.nodeName === "HTML" || node.nodeName === "BODY"
                  ? "fixed"
                  : "absolute")
            }}
            onClick={e => {
              e.stopPropagation();
              handleScrollUp(node);
              closeNotifier();
            }}
          >
            <NorthIcon
              sx={{ minWidth: "auto", width: "auto", color: "common.white" }}
            />
            <AvatarGroup
              max={4}
              sx={{
                ".MuiAvatar-root": {
                  borderColor: "common.alt"
                }
              }}
            >
              {data.map((item, i) => {
                const { username, photoUrl, id } = item.user || item;
                return (
                  <Avatar
                    key={i}
                    alt={`${username} avatar`}
                    src={`${photoUrl}`}
                    component={Link}
                    to={`/u/${id}`}
                  />
                );
              })}
            </AvatarGroup>
            <Typography
              variant="subtitle"
              sx={{
                wordBreak: "break-word"
              }}
            >
              {message}
            </Typography>
          </Button>,
          node.nodeName === "HTML" ? document.body : node
        )
      );
  }, [containerRef, data, message, open, sx, yCoords, position, closeNotifier]);
  return portal;
};

DataNotifier.propTypes = {};

export default DataNotifier;
