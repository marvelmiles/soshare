import React from "react";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import configReducer from "./slices/configSlice";
import userReducer from "./slices/userSlice";

const store = configureStore({
  reducer: persistReducer(
    {
      key: "root",
      storage,
      blacklist: ["user", "config"]
    },
    combineReducers({
      config: configReducer,
      user: persistReducer(
        {
          key: "user",
          storage,
          blacklist: ["previewUser"]
        },
        userReducer
      )
    })
  ),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
});

export const persistor = persistStore(store);

export const appContext = React.createContext();

export const Provider = appContext.Provider;

export const useContext = () => React.useContext(appContext);

export default store;
