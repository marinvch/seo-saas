import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { OrganizationUser } from '@prisma/client';
import type { RootState } from '../store';

interface Organization {
  id: string;
  name: string;
  slug: string;
  // Add other needed organization properties
}

interface UserState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  organizations: [],
  currentOrganization: null,
  loading: false,
  error: null,
};

export const fetchUserOrganizations = createAsyncThunk(
  'user/fetchUserOrganizations',
  async () => {
    const response = await fetch('/api/user/organizations');
    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }
    const data = await response.json();
    return data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action) => {
      state.currentOrganization = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrganizations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrganizations.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Handle organizations data directly as returned from the API
        if (action.payload && Array.isArray(action.payload)) {
          state.organizations = action.payload;
          
          // Set current organization to first one if none is selected and organizations exist
          if (!state.currentOrganization && action.payload.length > 0) {
            state.currentOrganization = action.payload[0];
          }
        }
      })
      .addCase(fetchUserOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch organizations';
      });
  },
});

export const { setCurrentOrganization } = userSlice.actions;

// Add a selector for getting the current organization
export const selectCurrentOrganization = (state: RootState) => state.user.currentOrganization;
export const selectOrganizations = (state: RootState) => state.user.organizations;

export default userSlice.reducer;
