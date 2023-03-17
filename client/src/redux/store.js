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
import configReducer from "./configSlice";
import userReducer from "./userSlice";
import { io } from "socket.io-client";
import { API_ENDPOINT } from "config";
export const store = configureStore({
  reducer: persistReducer(
    {
      key: "root",
      storage,
      blacklist: ["user"]
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

export const context = React.createContext();

export const useContext = () => React.useContext(context);
