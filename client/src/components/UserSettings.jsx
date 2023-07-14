import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "context/slices/userSlice";

const UserSettings = props => {
  const settings = useSelector(state => state.user.currentUser?.settings || {});
  const dispatch = useDispatch();
  const handleChange = e => {
    const { key } = e.currentTarget.dataset;
    dispatch(
      updateUser({
        settings: {
          [key]: e.currentTarget.checked
        }
      })
    );
  };
  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight="bold">
        Dialogs
      </Typography>
      {[
        {
          title: "Hide temporary delete medias dialog",
          key: "hideDelMediasDialog"
        },
        {
          title: "Hide temporary delete media dialog",
          key: "hideDelMediaDialog"
        },
        {
          title: "Hide delete warning dialog",
          key: "hideDelDialog"
        }
      ].map((item, i) => (
        <Stack key={i}>
          <Typography>{item.title}</Typography>
          <Switch
            checked={!!settings[item.key]}
            inputProps={{
              "data-key": item.key
            }}
            onChange={handleChange}
          />
        </Stack>
      ))}
    </Box>
  );
};

UserSettings.propTypes = {};

export default UserSettings;
