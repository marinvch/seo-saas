import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuditResult, PageAuditResult, AuditOptions } from '@/types/audit-types';

interface AuditState {
  audits: Record<string, AuditResult[]>; // projectId -> audit results array
  currentAudit: AuditResult | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuditState = {
  audits: {},
  currentAudit: null,
  status: 'idle',
  error: null,
};

// Async thunks for API calls
export const fetchProjectAudits = createAsyncThunk(
  'audits/fetchProjectAudits',
  async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}/audits`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch audits');
    }
    
    return await response.json() as AuditResult[];
  }
);

export const fetchAuditById = createAsyncThunk(
  'audits/fetchAuditById',
  async ({ projectId, auditId }: { projectId: string; auditId: string }) => {
    const response = await fetch(`/api/projects/${projectId}/audits/${auditId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch audit');
    }
    
    return await response.json() as AuditResult;
  }
);

export const startNewAudit = createAsyncThunk(
  'audits/startNewAudit',
  async ({ projectId, options }: { projectId: string; options: AuditOptions }) => {
    const response = await fetch(`/api/projects/${projectId}/audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start audit');
    }
    
    const data = await response.json();
    return { auditId: data.auditId as string, projectId };
  }
);

export const restartAudit = createAsyncThunk(
  'audits/restartAudit',
  async ({ projectId, auditId }: { projectId: string; auditId: string }) => {
    const response = await fetch(`/api/projects/${projectId}/audits/${auditId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'restart' }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to restart audit');
    }
    
    return await response.json();
  }
);

export const deleteAudit = createAsyncThunk(
  'audits/deleteAudit',
  async ({ projectId, auditId }: { projectId: string; auditId: string }) => {
    const response = await fetch(`/api/projects/${projectId}/audits/${auditId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete audit');
    }
    
    return auditId;
  }
);

// Create the slice
const auditsSlice = createSlice({
  name: 'audits',
  initialState,
  reducers: {
    clearCurrentAudit: (state) => {
      state.currentAudit = null;
    },
    // Updated to handle enum status from Prisma
    updateAudit: (state, action: PayloadAction<any>) => {
      const audit = action.payload;
      
      if (!audit || !audit.id) return;
      
      // Update current audit if it's the same one
      if (state.currentAudit && state.currentAudit.id === audit.id) {
        state.currentAudit = {
          ...state.currentAudit,
          ...audit,
        };
      }
      
      // Update in the project audits map
      for (const projectId in state.audits) {
        const audits = state.audits[projectId];
        const auditIndex = audits.findIndex(a => a.id === audit.id);
        
        if (auditIndex !== -1) {
          state.audits[projectId][auditIndex] = {
            ...state.audits[projectId][auditIndex],
            ...audit,
          };
          break;
        }
      }
    },
    updateAuditProgress: (state, action: PayloadAction<{ auditId: string; progress: number }>) => {
      const { auditId, progress } = action.payload;
      
      // Update current audit if it's the same one
      if (state.currentAudit && state.currentAudit.id === auditId) {
        state.currentAudit.progressPercentage = progress;
      }
      
      // Update in the project audits map
      for (const projectId in state.audits) {
        const audits = state.audits[projectId];
        const auditIndex = audits.findIndex(a => a.id === auditId);
        
        if (auditIndex !== -1) {
          state.audits[projectId][auditIndex].progressPercentage = progress;
          break;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetchProjectAudits
    builder.addCase(fetchProjectAudits.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchProjectAudits.fulfilled, (state, action) => {
      state.status = 'succeeded';
      // Store audits by project ID
      state.audits[action.meta.arg] = action.payload;
    });
    builder.addCase(fetchProjectAudits.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message || 'Failed to fetch audits';
    });
    
    // Handle fetchAuditById
    builder.addCase(fetchAuditById.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchAuditById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.currentAudit = action.payload;
    });
    builder.addCase(fetchAuditById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message || 'Failed to fetch audit';
    });
    
    // Handle startNewAudit
    builder.addCase(startNewAudit.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(startNewAudit.fulfilled, (state, action) => {
      state.status = 'succeeded';
      // After starting an audit, fetch it to update the state properly
      // The actual audit data will be populated by subsequent calls
    });
    builder.addCase(startNewAudit.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message || 'Failed to start audit';
    });
    
    // Handle restartAudit
    builder.addCase(restartAudit.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(restartAudit.fulfilled, (state, action) => {
      state.status = 'succeeded';
      // If we have the current audit, update its status to PENDING
      if (state.currentAudit && state.currentAudit.id === action.meta.arg.auditId) {
        state.currentAudit.status = 'pending';
        state.currentAudit.progressPercentage = 0;
      }
      
      // Update the audit in the project audits list
      const { projectId, auditId } = action.meta.arg;
      if (state.audits[projectId]) {
        const auditIndex = state.audits[projectId].findIndex(a => a.id === auditId);
        if (auditIndex !== -1) {
          state.audits[projectId][auditIndex].status = 'pending';
          state.audits[projectId][auditIndex].progressPercentage = 0;
        }
      }
    });
    builder.addCase(restartAudit.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message || 'Failed to restart audit';
    });
    
    // Handle deleteAudit
    builder.addCase(deleteAudit.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(deleteAudit.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const deletedAuditId = action.payload;
      
      // Remove from current audit if it matches
      if (state.currentAudit && state.currentAudit.id === deletedAuditId) {
        state.currentAudit = null;
      }
      
      // Remove from audits map
      for (const projectId in state.audits) {
        state.audits[projectId] = state.audits[projectId].filter(
          audit => audit.id !== deletedAuditId
        );
      }
    });
    builder.addCase(deleteAudit.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message || 'Failed to delete audit';
    });
  },
});

export const { clearCurrentAudit, updateAudit, updateAuditProgress } = auditsSlice.actions;
export default auditsSlice.reducer;