import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles
} from "@mui/material";
import { themeSettings } from "./theme";
import { useSelector } from "react-redux";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
const App = () => {
  const { mode } = useSelector(state => state.config);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "*": {
              transition: "all ease-in-out .25s"
            },
            textarea: {
              resize: "none"
            }
          }}
        />
        <Routes path="/">
          <Route index element={<HomePage />} />
          <Route path="u">
            <Route path=":userId" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
