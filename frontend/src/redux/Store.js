import { combineReducers, configureStore } from "@reduxjs/toolkit";
import themeSlice from "./themeSlice";
import authSlice from "./authSlice";
import groupSlice from "./groupSlice"
import supervisedGroupsSlice from "./supervisedGroupsSlice"
import milestoneSlice from "./milestoneSlice"

import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
}
const rootReducer = combineReducers({
  theme: themeSlice,
  auth: authSlice,
  group: groupSlice,
  supervised_groups : supervisedGroupsSlice,
  milestone : milestoneSlice
});
const persistedReducer = persistReducer(persistConfig, rootReducer)


const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
export default store;