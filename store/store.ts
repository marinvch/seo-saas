import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import userReducer from './slices/user-slice';
import projectsReducer from './slices/projects-slice';
import auditsReducer from './slices/audits-slice';
import keywordsReducer from './slices/keywords-slice';
import uiReducer from './slices/ui-slice';
import rankTrackingReducer from './slices/rank-tracking-slice';

// Configure persistence for specific reducers
const persistConfig = {
  key: 'root',
  storage,
  // Only persist UI state by default
  // Add other reducers here if you want them to persist
  whitelist: ['ui'],
};

const rootReducer = combineReducers({
  user: userReducer,
  projects: projectsReducer,
  audits: auditsReducer,
  keywords: keywordsReducer,
  ui: uiReducer,
  rankTracking: rankTrackingReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;