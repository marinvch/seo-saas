import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define role type from Prisma schema
export enum Role {
  USER = 'USER',
  AGENCY_OWNER = 'AGENCY_OWNER',
  AGENCY_MEMBER = 'AGENCY_MEMBER',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

// User interface matching Prisma/NextAuth schema
export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: string | null;
  image?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// Organization interface matching Prisma schema
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
  stripeCustomerId?: string | null;
}

// OrganizationUser interface for user-organization relationships
export interface OrganizationUser {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  organization: Organization;
}

// Interface for user state slice
interface UserState {
  user: User | null;
  organizations: OrganizationUser[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state for user slice
const initialState: UserState = {
  user: null,
  organizations: [],
  currentOrganization: null,
  isLoading: false,
  error: null,
};

// Async thunk for fetching current user data
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/user/me');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user data');
    }
  }
);

// Async thunk for fetching user organizations
export const fetchUserOrganizations = createAsyncThunk(
  'user/fetchUserOrganizations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/user/organizations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user organizations');
      }
      
      const data = await response.json();
      return data.organizations;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user organizations');
    }
  }
);

// Async thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user profile');
    }
  }
);

// Async thunk for creating a new organization
export const createOrganization = createAsyncThunk(
  'user/createOrganization',
  async (orgData: { name: string; slug?: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create organization');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create organization');
    }
  }
);

// User slice for managing user and organization data
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Set current organization
    setCurrentOrganization: (state, action: PayloadAction<string>) => {
      const org = state.organizations.find(o => o.organizationId === action.payload);
      if (org) {
        state.currentOrganization = org.organization;
      }
    },
    
    // Clear user data (logout)
    clearUserData: (state) => {
      state.user = null;
      state.organizations = [];
      state.currentOrganization = null;
    },
    
    // Manually set user data (when session changes)
    setUserData: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch current user cases
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch user organizations cases
      .addCase(fetchUserOrganizations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserOrganizations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.organizations = action.payload;
        
        // Set current organization to first one if none is selected
        if (!state.currentOrganization && action.payload.length > 0) {
          state.currentOrganization = action.payload[0].organization;
        }
      })
      .addCase(fetchUserOrganizations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update user profile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create organization cases
      .addCase(createOrganization.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Add new organization to the list
        const newOrgUser = action.payload.organizationUser;
        state.organizations.push(newOrgUser);
        
        // Set as current organization
        state.currentOrganization = newOrgUser.organization;
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const {
  setCurrentOrganization,
  clearUserData,
  setUserData,
} = userSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.user.user;
export const selectUserOrganizations = (state: RootState) => state.user.organizations;
export const selectCurrentOrganization = (state: RootState) => state.user.currentOrganization;
export const selectIsAdmin = (state: RootState) => 
  state.user.user?.role === Role.ADMIN;
export const selectIsAgencyOwner = (state: RootState) => 
  state.user.user?.role === Role.AGENCY_OWNER || 
  state.user.user?.role === Role.ADMIN;

export default userSlice.reducer;