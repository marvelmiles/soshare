import { createSlice } from "@reduxjs/toolkit";

const initialState = {};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    logoutUser() {},
    loginUser() {}
  }
});

export const { logoutUser, loginUser } = userSlice.actions;

export default userSlice.reducer;
