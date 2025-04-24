'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../../store/store';

interface ReduxProviderProps {
  children: React.ReactNode;
}

/**
 * Redux Provider component that wraps the application with Redux store
 * and Redux-persist for state persistence
 */
export default function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}