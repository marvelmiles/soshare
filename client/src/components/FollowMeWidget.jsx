import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { WidgetContainer } from "./styled";
import { Typography } from "@mui/material";
import FollowMe from "./FollowMe";
import { Snackbar } from "@mui/material";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import http from "api/http";

const FollowMeWidget = ({
  title = "People to follow",
  url = "suggest",
  width
}) => {
  const [users, setUsers] = useState(Array.from(new Array(0)));
  useEffect(() => {
    (async () => {
      try {
        setUsers(
          await http.get(
            {
              suggest: "/user/suggest-followers",
              followers: "/user/followers",
              following: "/user/following"
            }[url] || url,
            {
              withCredentials: true
            }
          )
        );
      } catch (err) {}
    })();
  }, [url]);
  return (
    <WidgetContainer
      sx={{
        width
      }}
    >
      <Typography variant="h5" fontWeight="bold" mb={2}>
        {title}
      </Typography>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alginItems: "center",
          flexDirection: "column"
        }}
      >
        {users.length ? (
          users.map((u, i) => (
            <FollowMe
              user={u}
              key={i}
              onSuccess={() => setUsers(users.filter(_u => _u.id !== u.id))}
            />
          ))
        ) : (
          <Typography>Know suggestions</Typography>
        )}
      </div>
    </WidgetContainer>
  );
};

FollowMeWidget.propTypes = {};

export default FollowMeWidget;
