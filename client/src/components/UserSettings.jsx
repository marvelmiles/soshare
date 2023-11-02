import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "context/slices/userSlice";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";

const UserSettings = props => {
  const settings = useSelector(state => state.user.currentUser?.settings || {});
  const dispatch = useDispatch();

  const handleChange = (e, val) => {
    const { key } = e.currentTarget.dataset;

    dispatch(
      updateUser({
        key: "settings",
        value: {
          [key]: val
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
          title: "Hide delete dialog",
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

      <FormControl>
        <Typography variant="h5" fontWeight="bold">
          Theme
        </Typography>
        <RadioGroup
          aria-labelledby="Theme mode selection"
          value={settings.theme}
          name="theme-radio-group"
          onChange={handleChange}
        >
          <FormControlLabel
            value="dark"
            control={
              <Radio
                inputProps={{
                  "data-key": "theme"
                }}
              />
            }
            label="Dark Mode"
          />
          <FormControlLabel
            value="light"
            control={
              <Radio
                inputProps={{
                  "data-key": "theme"
                }}
              />
            }
            label="Light Mode"
          />
          <FormControlLabel
            value="system"
            control={
              <Radio
                data-key="theme"
                inputProps={{
                  "data-key": "theme"
                }}
              />
            }
            label="System Mode"
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

UserSettings.propTypes = {};

export default UserSettings;
