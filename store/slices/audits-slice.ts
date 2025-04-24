import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define audit status from Prisma schema
export enum AuditStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Audit interface matching Prisma schema
export interface SiteAudit {
  id: string;
  projectId: string;
  siteUrl: string;
  status: AuditStatus;
  startedAt: string;
  completedAt?: string | null;
  totalPages: number;
  progressPercentage?: number | null;
  options: Record<string, any>;
  pageResults?: Record<string, any> | null;
  issuesSummary: Record<string, any>;
  errorMessage?: string | null;
  htmlReport?: string | null;
}

// Interface for audit schedule
export interface AuditSchedule {
  id: string;
  projectId: string;
  frequency: string;
  lastRunAt?: string | null;
  nextRunAt: string;
  isActive: boolean;
  options: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Interface for the audits state slice
interface AuditsState {
  audits: SiteAudit[];
  currentAudit: SiteAudit | null;
  auditSchedules: AuditSchedule[];
  isLoading: boolean;
  error: string | null;
  pollingActive: boolean;
}

// Initial state for audits slice
const initialState: AuditsState = {
  audits: [],
  currentAudit: null,
  auditSchedules: [],
  isLoading: false,
  error: null,
  pollingActive: false,
};

// Async thunk for fetching audits for a project
export const fetchProjectAudits = createAsyncThunk(
  'audits/fetchProjectAudits',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audits`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project audits');
      }
      
      const data = await response.json();
      return data.audits;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch project audits');
    }
  }
);

// Async thunk for fetching a single audit
export const fetchAuditById = createAsyncThunk(
  'audits/fetchAuditById',
  async ({ projectId, auditId }: { projectId: string; auditId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audits/${auditId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch audit');
    }
  }
);

// Async thunk for creating a new audit
export const createAudit = createAsyncThunk(
  'audits/createAudit',
  async (auditData: { projectId: string; siteUrl: string; options: Record<string, any> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${auditData.projectId}/audits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create audit');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create audit');
    }
  }
);

// Async thunk for fetching audit progress
export const fetchAuditProgress = createAsyncThunk(
  'audits/fetchAuditProgress',
  async ({ projectId, auditId }: { projectId: string; auditId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audits/${auditId}/progress`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit progress');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch audit progress');
    }
  }
);

// Async thunk for fetching audit schedules
export const fetchAuditSchedules = createAsyncThunk(
  'audits/fetchAuditSchedules',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audit-schedule`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit schedules');
      }
      
      const data = await response.json();
      return data.schedules;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch audit schedules');
    }
  }
);

// Async thunk for creating/updating an audit schedule
export const saveAuditSchedule = createAsyncThunk(
  'audits/saveAuditSchedule',
  async (scheduleData: Partial<AuditSchedule> & { projectId: string }, { rejectWithValue }) => {
    try {
      const method = scheduleData.id ? 'PUT' : 'POST';
      const url = scheduleData.id 
        ? `/api/projects/${scheduleData.projectId}/audit-schedule/${scheduleData.id}`
        : `/api/projects/${scheduleData.projectId}/audit-schedule`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save audit schedule');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save audit schedule');
    }
  }
);

// Audits slice for managing audit data
const auditsSlice = createSlice({
  name: 'audits',
  initialState,
  reducers: {
    // Set current audit
    setCurrentAudit: (state, action: PayloadAction<SiteAudit | null>) => {
      state.currentAudit = action.payload;
    },
    
    // Update audit progress locally (for real-time updates)
    updateAuditProgress: (state, action: PayloadAction<{ auditId: string; progress: number; status?: AuditStatus }>) => {
      const { auditId, progress, status } = action.payload;
      
      // Update in audits array
      const auditIndex = state.audits.findIndex(audit => audit.id === auditId);
      if (auditIndex !== -1) {
        state.audits[auditIndex].progressPercentage = progress;
        if (status) {
          state.audits[auditIndex].status = status;
        }
      }
      
      // Update current audit if it matches
      if (state.currentAudit?.id === auditId) {
        state.currentAudit.progressPercentage = progress;
        if (status) {
          state.currentAudit.status = status;
        }
      }
    },
    
    // Toggle polling status
    setPollingActive: (state, action: PayloadAction<boolean>) => {
      state.pollingActive = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch project audits cases
    builder
      .addCase(fetchProjectAudits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectAudits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audits = action.payload;
      })
      .addCase(fetchProjectAudits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch audit by ID cases
      .addCase(fetchAuditById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAudit = action.payload;
        
        // Also update in the audits array if exists
        const auditIndex = state.audits.findIndex(audit => audit.id === action.payload.id);
        if (auditIndex !== -1) {
          state.audits[auditIndex] = action.payload;
        } else {
          state.audits.push(action.payload);
        }
      })
      .addCase(fetchAuditById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create audit cases
      .addCase(createAudit.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAudit.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audits.unshift(action.payload); // Add to beginning of array
        state.currentAudit = action.payload;
        state.pollingActive = true; // Start polling for this audit
      })
      .addCase(createAudit.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch audit progress cases
      .addCase(fetchAuditProgress.fulfilled, (state, action) => {
        const { id, progressPercentage, status } = action.payload;
        
        // Update in audits array
        const auditIndex = state.audits.findIndex(audit => audit.id === id);
        if (auditIndex !== -1) {
          state.audits[auditIndex].progressPercentage = progressPercentage;
          state.audits[auditIndex].status = status;
        }
        
        // Update current audit if it matches
        if (state.currentAudit?.id === id) {
          state.currentAudit.progressPercentage = progressPercentage;
          state.currentAudit.status = status;
          
          // Stop polling if audit is completed or failed
          if (status === AuditStatus.COMPLETED || status === AuditStatus.FAILED) {
            state.pollingActive = false;
          }
        }
      })
      
      // Fetch audit schedules cases
      .addCase(fetchAuditSchedules.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditSchedules.fulfilled, (state, action) => {
        state.isLoading = false;
        state.auditSchedules = action.payload;
      })
      .addCase(fetchAuditSchedules.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Save audit schedule cases
      .addCase(saveAuditSchedule.fulfilled, (state, action) => {
        const scheduleIndex = state.auditSchedules.findIndex(
          schedule => schedule.id === action.payload.id
        );
        
        if (scheduleIndex !== -1) {
          // Update existing schedule
          state.auditSchedules[scheduleIndex] = action.payload;
        } else {
          // Add new schedule
          state.auditSchedules.push(action.payload);
        }
      });
  },
});

// Export actions and reducer
export const {
  setCurrentAudit,
  updateAuditProgress,
  setPollingActive,
} = auditsSlice.actions;

// Selectors
export const selectAuditsByProjectId = (state: RootState, projectId: string) => {
  return state.audits.audits.filter(audit => audit.projectId === projectId);
};

export const selectSchedulesByProjectId = (state: RootState, projectId: string) => {
  return state.audits.auditSchedules.filter(schedule => schedule.projectId === projectId);
};

export default auditsSlice.reducer;