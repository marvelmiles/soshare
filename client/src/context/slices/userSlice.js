import { createSlice } from "@reduxjs/toolkit";
import http from "api/http";
import { updateStatePath } from "../utils";
import { mapToObject } from "utils";

export const defaultUser = {
  following: [],
  followers: [],
  recommendationBlacklist: [],
  socials: {},
  settings: {
    theme: "light"
  },
  blacklistCount: 0,
  // client properties
  _blockedUsers: {},
  _disapprovedUsers: {}
};

const initialState = {
  previewUser: {},
  currentUser: defaultUser
};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    signOutUser(state) {
      if (!!state.currentUser.id)
        http
          .patch(
            "/auth/signout",
            {
              settings: state.currentUser.settings
            },
            {
              _noRefresh: true
            }
          )
          .then(() => {})
          .catch(() => {});

      const settings = state.currentUser.settings;

      localStorage.setItem(
        "theme",
        settings.theme || defaultUser.settings.theme
      );

      state.currentUser = {
        ...defaultUser,
        settings
      };
      state.previewUser = {};
    },
    signInUser(state, { payload }) {
      state.currentUser = {
        ...defaultUser,
        ...payload,
        settings: {
          ...defaultUser.settings,
          ...payload.settings
        },
        _disapprovedUsers: mapToObject(payload.recommendationBlacklist),
        _blockedUsers: mapToObject(payload.blockedUsers)
      }
    },
    updatePreviewUser(state, { payload }) {
      if (payload.nullify) return (state.previewUser = undefined);

      delete payload.avatar;

      updateStatePath(state, "previewUser", payload);
    },
    updateUser(state, { payload }) {
      if (payload.key === "settings" && payload.value.theme)
        localStorage.setItem("theme", payload.value.theme);

      updateStatePath(state, "currentUser", payload);
    },
    deleteFromPreviewUser(state, { payload }) {
      if (state.previewUser) {
        for (let key in payload) {
          if (!state.previewUser[key]) continue;
          switch (key) {
            case "socials":
              delete state.previewUser[key][payload[key]];
              break;
            default:
              delete state.previewUser[key];
              break;
          }
        }
      }
    }
  }
});

export const {
  signOutUser,
  signInUser,
  updatePreviewUser,
  updateUser,
  deleteFromPreviewUser
} = userSlice.actions;

export default userSlice.reducer;
