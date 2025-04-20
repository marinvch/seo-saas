import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuditStatus } from '@prisma/client';

export interface Audit {
  id: string;
  projectId: string;
  status: AuditStatus;
  score?: number | null;
  issuesFound?: number | null;
  criticalIssues?: number | null;
  startedAt: string;
  completedAt?: string | null;
  crawledUrls?: number | null;
  crawlDepth: number;
}

export interface AuditResult {
  auditId: string;
  results: {
    meta: {
      title?: string;
      description?: string;
    };
    performance: {
      mobile?: number;
      desktop?: number;
    };
    seo: Record<string, any>;
    accessibility: Record<string, any>;
    bestPractices: Record<string, any>;
    issues: Array<{
      type: string;
      url: string;
      description: string;
      severity: 'critical' | 'major' | 'minor' | 'info';
      recommendation?: string;
    }>;
  };
}

interface AuditsState {
  audits: Audit[];
  auditResults: Record<string, AuditResult>;
  currentAudit: Audit | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuditsState = {
  audits: [],
  auditResults: {},
  currentAudit: null,
  isLoading: false,
  error: null,
};

export const fetchAudits = createAsyncThunk(
  'audits/fetchAudits',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audits`);
      if (!response.ok) {
        throw new Error('Failed to fetch audits');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAuditResults = createAsyncThunk(
  'audits/fetchAuditResults',
  async (auditId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/audits/${auditId}/results`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit results');
      }
      const data = await response.json();
      return { auditId, results: data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const startNewAudit = createAsyncThunk(
  'audits/startNewAudit',
  async ({ projectId, options }: { projectId: string; options: { crawlDepth: number } }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start audit');
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const auditsSlice = createSlice({
  name: 'audits',
  initialState,
  reducers: {
    setCurrentAudit: (state, action: PayloadAction<string>) => {
      state.currentAudit = state.audits.find(audit => audit.id === action.payload) || null;
    },
    clearCurrentAudit: (state) => {
      state.currentAudit = null;
    },
    updateAuditStatus: (state, action: PayloadAction<{ id: string; status: AuditStatus }>) => {
      const { id, status } = action.payload;
      const audit = state.audits.find(a => a.id === id);
      if (audit) {
        audit.status = status;
        if (status === 'COMPLETED') {
          audit.completedAt = new Date().toISOString();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAudits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAudits.fulfilled, (state, action: PayloadAction<Audit[]>) => {
        state.isLoading = false;
        state.audits = action.payload;
      })
      .addCase(fetchAudits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAuditResults.fulfilled, (state, action) => {
        const { auditId, results } = action.payload;
        state.auditResults[auditId] = {
          auditId,
          results,
        };
      })
      .addCase(startNewAudit.fulfilled, (state, action: PayloadAction<Audit>) => {
        state.audits.unshift(action.payload);
        state.currentAudit = action.payload;
      });
  },
});

export const { setCurrentAudit, clearCurrentAudit, updateAuditStatus } = auditsSlice.actions;
export const auditsReducer = auditsSlice.reducer;