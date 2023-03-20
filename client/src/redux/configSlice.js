import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "dark"
};

const configSlice = createSlice({
  initialState,
  name: "config",
  reducers: {
    toggleThemeMode(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
    }
  }
});

export const { toggleThemeMode, toggleDrawer } = configSlice.actions;

export default configSlice.reducer;
