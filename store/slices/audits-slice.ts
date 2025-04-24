import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { AuditStatus } from '@prisma/client';

interface AuditState {
    currentAudit: {
        id: string;
        status: AuditStatus;
        progressPercentage: number;
        totalPages: number;
        error?: string;
        issuesSummary?: {
            issues: Array<{
                severity: 'critical' | 'warning' | 'info';
                message: string;
                details?: string;
                affectedUrls?: string[];
            }>;
        };
    } | null;
    auditHistory: Array<{
        id: string;
        status: AuditStatus;
        startedAt: Date;
        completedAt?: Date;
        totalPages: number;
    }>;
    loading: boolean;
    error: string | null;
}

const initialState: AuditState = {
    currentAudit: null,
    auditHistory: [],
    loading: false,
    error: null
};

// Async thunks
export const startSiteAudit = createAsyncThunk(
    'audits/startAudit',
    async ({ projectId, options }: { projectId: string; options?: any }) => {
        const response = await fetch(`/api/projects/${projectId}/audits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options || {})
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to start audit');
        }

        return response.json();
    }
);

export const fetchAuditStatus = createAsyncThunk(
    'audits/fetchStatus',
    async ({ projectId, auditId }: { projectId: string; auditId: string }) => {
        const response = await fetch(`/api/projects/${projectId}/audits?auditId=${auditId}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch audit status');
        }

        return response.json();
    }
);

export const fetchAuditHistory = createAsyncThunk(
    'audits/fetchHistory',
    async (projectId: string) => {
        const response = await fetch(`/api/projects/${projectId}/audits`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch audit history');
        }

        return response.json();
    }
);

const auditsSlice = createSlice({
    name: 'audits',
    initialState,
    reducers: {
        clearCurrentAudit: (state) => {
            state.currentAudit = null;
        },
        updateAuditProgress: (state, action) => {
            if (state.currentAudit) {
                state.currentAudit = {
                    ...state.currentAudit,
                    ...action.payload
                };
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Start Audit
            .addCase(startSiteAudit.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(startSiteAudit.fulfilled, (state, action) => {
                state.loading = false;
                state.currentAudit = {
                    id: action.payload.auditId,
                    status: 'PENDING',
                    progressPercentage: 0,
                    totalPages: 0
                };
            })
            .addCase(startSiteAudit.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to start audit';
            })
            // Fetch Status
            .addCase(fetchAuditStatus.fulfilled, (state, action) => {
                const [audit] = action.payload;
                if (audit && state.currentAudit?.id === audit.id) {
                    state.currentAudit = {
                        id: audit.id,
                        status: audit.status,
                        progressPercentage: audit.progressPercentage,
                        totalPages: audit.totalPages,
                        error: audit.errorMessage
                    };
                }
            })
            // Fetch History
            .addCase(fetchAuditHistory.fulfilled, (state, action) => {
                state.auditHistory = action.payload.map((audit: any) => ({
                    id: audit.id,
                    status: audit.status,
                    startedAt: new Date(audit.startedAt),
                    completedAt: audit.completedAt ? new Date(audit.completedAt) : undefined,
                    totalPages: audit.totalPages
                }));
            });
    }
});

export const { clearCurrentAudit, updateAuditProgress } = auditsSlice.actions;

// Selectors
export const selectCurrentAudit = (state: RootState) => state.audits.currentAudit;
export const selectAuditHistory = (state: RootState) => state.audits.auditHistory;
export const selectAuditLoading = (state: RootState) => state.audits.loading;
export const selectAuditError = (state: RootState) => state.audits.error;

export default auditsSlice.reducer;