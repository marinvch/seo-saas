import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import feature slices
import uiReducer from './slices/ui-slice';
import projectsReducer from './slices/projects-slice';
import auditsReducer from './slices/audits-slice';
import keywordsReducer from './slices/keywords-slice';
import userReducer from './slices/user-slice';

// Configure persist options
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['ui', 'user'], // Only persist these reducers
};

// Combine reducers
const rootReducer = combineReducers({
  ui: uiReducer,
  projects: projectsReducer,
  audits: auditsReducer,
  keywords: keywordsReducer,
  user: userReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure the Redux store with all feature slices and middleware
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Enable refetchOnFocus/refetchOnReconnect for RTK Query
setupListeners(store.dispatch);

// Create persisted store
export const persistor = persistStore(store);

// Export types for use in typed hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;