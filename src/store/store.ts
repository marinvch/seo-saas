import { configureStore } from "@reduxjs/toolkit";
import { projectsReducer } from "./slices/projects-slice";
import { keywordsReducer } from "./slices/keywords-slice";
import auditsReducer from "./slices/audits-slice";
import { uiReducer } from "./slices/ui-slice";

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    keywords: keywordsReducer,
    audits: auditsReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
