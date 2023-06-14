import { createSlice } from "@reduxjs/toolkit";
import http from "api/http";

export const defaultUser = {
  following: [],
  followers: [],
  recommendationBlacklist: [],
  socials: {},
  settings: {}
};

const initialState = {
  previewUser: undefined,
  currentUser: defaultUser
};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    logoutUser(state) {
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
      if (payload._blacklistCount) {
        payload.blacklistCount = state.currentUser.blacklistCount
          ? state.currentUser.blacklistCount - payload._blacklistCount
          : 0;
        delete payload._blacklistCount;
      }

      if (payload.blacklistCount) {
        payload.blacklistCount =
          state.currentUser.blacklistCount + payload._blacklistCount;
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
