import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  autoClose?: boolean;
}

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: any;
}

interface UiState {
  sidebarCollapsed: boolean;
  activeView: string;
  isMobileMenuOpen: boolean;
  notifications: Notification[];
  modal: ModalState;
  isLoading: Record<string, boolean>;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  activeView: 'dashboard',
  isMobileMenuOpen: false,
  notifications: [],
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  isLoading: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setActiveView: (state, action: PayloadAction<string>) => {
      state.activeView = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({
        ...action.payload,
        id,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data,
      };
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null,
      };
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.isLoading[action.payload.key] = action.payload.isLoading;
    },
  },
});

export const {
  toggleSidebar,
  setActiveView,
  toggleMobileMenu,
  addNotification,
  removeNotification,
  openModal,
  closeModal,
  setLoading,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;