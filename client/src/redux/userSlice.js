import { createSlice } from "@reduxjs/toolkit";
import http from "../api/http";

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
      state.currentUser = undefined;
      state.previewUser = undefined;
      if (isLoggedIn)
        http
          .patch(
            "/auth/signout",
            {},
            {
              noRefresh: true
            }
          )
          .then(() => console.log("signout"))
          .catch(message => console.log(message));
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
      state.currentUser = {
        ...state.currentUser,
        ...payload
      };
    }
  }
});

export const {
  logoutUser,
  loginUser,
  updatePreviewUser,
  updateUser
} = userSlice.actions;

export default userSlice.reducer;
