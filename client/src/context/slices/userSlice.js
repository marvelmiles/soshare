import { createSlice } from "@reduxjs/toolkit";
import http from "api/http";

const initialState = {
  previewUser: null,
  currentUser: null
};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    logoutUser(state) {
      const isLoggedIn = !!state.currentUser;
      if (isLoggedIn)
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
      state.currentUser = undefined;
      state.previewUser = undefined;
    },
    loginUser(state, { payload }) {
      state.currentUser = payload;
    },
    updatePreviewUser(state, { payload }) {
      delete payload.avatar;
      payload.socials &&
        (payload.socials = {
          ...state.previewUser?.socials,
          ...payload.socials
        });
      state.previewUser = {
        ...state.previewUser,
        ...payload
      };
    },
    updateUser(state, { payload }) {
      payload.socials &&
        (payload.socials = {
          ...state.currentUser.socials,
          ...payload.socials
        });
      if (payload.settings) {
        payload.settings = {
          ...state.currentUser.settings,
          ...payload.settings
        };
      }
      state.currentUser = {
        ...state.currentUser,
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
  logoutUser,
  loginUser,
  updatePreviewUser,
  updateUser,
  deleteFromPreviewUser
} = userSlice.actions;

export default userSlice.reducer;
