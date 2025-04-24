import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for notification objects
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

/**
 * Interface for the UI state slice
 */
interface UiState {
  theme: 'light' | 'dark' | 'system';
  sidebarExpanded: boolean;
  notifications: Notification[];
  isLoading: boolean;
  loadingMessage: string | null;
  currentModal: string | null;
}

/**
 * Initial state for UI slice
 */
const initialState: UiState = {
  theme: 'system',
  sidebarExpanded: true,
  notifications: [],
  isLoading: false,
  loadingMessage: null,
  currentModal: null,
};

/**
 * UI slice for managing application UI state
 * Handles theme, sidebar, loading states, notifications, and modals
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidebarExpanded = action.payload;
    },
    
    // Loading state actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },
    setLoadingMessage: (state, action: PayloadAction<string | null>) => {
      state.loadingMessage = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Modal actions
    openModal: (state, action: PayloadAction<string>) => {
      state.currentModal = action.payload;
    },
    closeModal: (state) => {
      state.currentModal = null;
    },
  },
});

// Export actions and reducer
export const {
  setTheme,
  toggleSidebar,
  setSidebarExpanded,
  setLoading,
  setLoadingMessage,
  addNotification,
  removeNotification,
  clearAllNotifications,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;