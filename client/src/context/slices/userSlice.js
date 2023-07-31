import { createSlice } from "@reduxjs/toolkit";
import http from "api/http";

export const defaultUser = {
  following: [],
  followers: [],
  recommendationBlacklist: [],
  socials: {},
  settings: {},
  blacklistCount: 0,
  // client properties
  blockedUsers: {},
  disapprovedUsers: {}
};

const initialState = {
  previewUser: undefined,
  currentUser: defaultUser
};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    signoutUser(state) {
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
      state.currentUser = defaultUser;
      state.previewUser = undefined;
    },
    loginUser(state, { payload }) {
      state.currentUser = payload;
    },
    updatePreviewUser(state, { payload }) {
      if (payload.nullify) return (state.previewUser = undefined);
      delete payload.avatar;
      updateUser(state, { payload, _path: "previewUser" });
    },
    updateUser(state, { payload, _path = "currentUser" }) {
      const key = payload.key;

      if (key) {
        if (payload.whitelist) {
          const obj = { ...state[_path][key] };
          delete obj[payload.value];
          state[_path][key] = { ...obj };
        } else {
          state[_path][key] = {
            ...state[_path][key],
            ...payload.value
          };
        }
        state[_path] = {
          ...state[_path]
        };
      } else
        state[_path] = {
          ...state[_path],
          ...payload
        };
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
  signoutUser,
  loginUser,
  updatePreviewUser,
  updateUser,
  deleteFromPreviewUser
} = userSlice.actions;

export default userSlice.reducer;
