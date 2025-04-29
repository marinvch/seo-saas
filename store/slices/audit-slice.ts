import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { AuditResult, SiteAuditConfig } from '@/types/audit';

interface AuditState {
  currentAudit: AuditResult | null;
  auditHistory: AuditResult[];
  loading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  currentAudit: null,
  auditHistory: [],
  loading: false,
  error: null,
};

// Async thunks
export const startAudit = createAsyncThunk(
  'audit/startAudit',
  async ({ projectId, config }: { projectId: string; config: SiteAuditConfig }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to start audit');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to start audit');
    }
  }
);

export const fetchAuditStatus = createAsyncThunk(
  'audit/fetchAuditStatus',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audit`);

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch audit status');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch audit status');
    }
  }
);

export const fetchAuditHistory = createAsyncThunk(
  'audit/fetchAuditHistory',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audit/history`);

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch audit history');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch audit history');
    }
  }
);

// Slice
const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearCurrentAudit: (state) => {
      state.currentAudit = null;
    },
  },
  extraReducers: (builder) => {
    // Start audit cases
    builder.addCase(startAudit.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(startAudit.fulfilled, (state, action) => {
      state.currentAudit = action.payload;
      state.loading = false;
    });
    builder.addCase(startAudit.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch audit status cases
    builder.addCase(fetchAuditStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAuditStatus.fulfilled, (state, action) => {
      state.currentAudit = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchAuditStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch audit history cases
    builder.addCase(fetchAuditHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAuditHistory.fulfilled, (state, action) => {
      state.auditHistory = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchAuditHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Selectors
export const selectCurrentAudit = (state: RootState) => state.audit.currentAudit;
export const selectAuditHistory = (state: RootState) => state.audit.auditHistory;
export const selectAuditLoading = (state: RootState) => state.audit.loading;
export const selectAuditError = (state: RootState) => state.audit.error;

// Actions
export const { clearCurrentAudit } = auditSlice.actions;

// Reducer
export default auditSlice.reducer;