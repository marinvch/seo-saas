import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { OrganizationUser } from '@prisma/client';

interface UserState {
  organizations: OrganizationUser[];
  currentOrganization: OrganizationUser['organization'] | null;
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
        
        // Ensure action.payload.data exists and is an array before assigning
        if (action.payload?.data && Array.isArray(action.payload.data)) {
          state.organizations = action.payload.data;
          
          // Set current organization to first one if none is selected and organizations exist
          if (!state.currentOrganization && state.organizations.length > 0) {
            state.currentOrganization = state.organizations[0].organization;
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
export default userSlice.reducer;
