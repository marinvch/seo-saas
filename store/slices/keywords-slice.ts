import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface Keyword {
  id: string;
  projectId: string;
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordSuggestion {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
}

export interface KeywordsState {
  keywords: Keyword[];
  selectedKeyword: Keyword | null;
  loading: boolean;
  error: string | null;
  researchResults: KeywordSuggestion[] | null;
  researchLoading: boolean;
}

// Initial state
const initialState: KeywordsState = {
  keywords: [],
  selectedKeyword: null,
  loading: false,
  error: null,
  researchResults: null,
  researchLoading: false,
};

// Async thunks
export const fetchKeywords = createAsyncThunk(
  'keywords/fetchKeywords',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch keywords');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch keywords');
    }
  }
);

export const fetchKeyword = createAsyncThunk(
  'keywords/fetchKeyword',
  async ({ projectId, keywordId }: { projectId: string, keywordId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords/${keywordId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch keyword');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch keyword');
    }
  }
);

export const addKeyword = createAsyncThunk(
  'keywords/addKeyword',
  async (data: { projectId: string; keyword: string; volume?: number; difficulty?: number; cpc?: number; intent?: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${data.projectId}/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: data.keyword,
          volume: data.volume,
          difficulty: data.difficulty,
          cpc: data.cpc,
          intent: data.intent,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to add keyword');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to add keyword');
    }
  }
);

export const updateKeyword = createAsyncThunk(
  'keywords/updateKeyword',
  async (
    data: { 
      projectId: string; 
      keywordId: string; 
      updates: { 
        keyword?: string; 
        volume?: number; 
        difficulty?: number; 
        cpc?: number; 
        intent?: string 
      } 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/projects/${data.projectId}/keywords/${data.keywordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to update keyword');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to update keyword');
    }
  }
);

export const deleteKeyword = createAsyncThunk(
  'keywords/deleteKeyword',
  async ({ projectId, keywordId }: { projectId: string; keywordId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords/${keywordId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to delete keyword');
      }
      
      return { keywordId }; // Return the id to remove from state
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to delete keyword');
    }
  }
);

export const bulkAddKeywords = createAsyncThunk(
  'keywords/bulkAddKeywords',
  async ({ projectId, keywords }: { projectId: string; keywords: string[] }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to add keywords');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to add keywords');
    }
  }
);

export const researchKeywords = createAsyncThunk(
  'keywords/researchKeywords',
  async ({ projectId, seed }: { projectId: string; seed: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seed }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to research keywords');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to research keywords');
    }
  }
);

// Slice
const keywordsSlice = createSlice({
  name: 'keywords',
  initialState,
  reducers: {
    selectKeyword: (state, action: PayloadAction<string>) => {
      state.selectedKeyword = state.keywords.find(k => k.id === action.payload) || null;
    },
    clearSelectedKeyword: (state) => {
      state.selectedKeyword = null;
    },
    clearResearchResults: (state) => {
      state.researchResults = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch keywords cases
    builder.addCase(fetchKeywords.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchKeywords.fulfilled, (state, action) => {
      state.keywords = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchKeywords.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch single keyword cases
    builder.addCase(fetchKeyword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchKeyword.fulfilled, (state, action) => {
      // Add to keywords array if not present
      const existingIndex = state.keywords.findIndex(k => k.id === action.payload.id);
      if (existingIndex >= 0) {
        state.keywords[existingIndex] = action.payload;
      } else {
        state.keywords.push(action.payload);
      }
      state.selectedKeyword = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchKeyword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Add keyword cases
    builder.addCase(addKeyword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addKeyword.fulfilled, (state, action) => {
      state.keywords.push(action.payload);
      state.loading = false;
    });
    builder.addCase(addKeyword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Update keyword cases
    builder.addCase(updateKeyword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateKeyword.fulfilled, (state, action) => {
      const index = state.keywords.findIndex(k => k.id === action.payload.id);
      if (index >= 0) {
        state.keywords[index] = action.payload;
      }
      if (state.selectedKeyword && state.selectedKeyword.id === action.payload.id) {
        state.selectedKeyword = action.payload;
      }
      state.loading = false;
    });
    builder.addCase(updateKeyword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Delete keyword cases
    builder.addCase(deleteKeyword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteKeyword.fulfilled, (state, action) => {
      state.keywords = state.keywords.filter(k => k.id !== action.payload.keywordId);
      if (state.selectedKeyword && state.selectedKeyword.id === action.payload.keywordId) {
        state.selectedKeyword = null;
      }
      state.loading = false;
    });
    builder.addCase(deleteKeyword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Bulk add keywords cases
    builder.addCase(bulkAddKeywords.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(bulkAddKeywords.fulfilled, (state, action) => {
      state.keywords = [...state.keywords, ...action.payload];
      state.loading = false;
    });
    builder.addCase(bulkAddKeywords.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Research keywords cases
    builder.addCase(researchKeywords.pending, (state) => {
      state.researchLoading = true;
      state.error = null;
    });
    builder.addCase(researchKeywords.fulfilled, (state, action) => {
      state.researchResults = action.payload;
      state.researchLoading = false;
    });
    builder.addCase(researchKeywords.rejected, (state, action) => {
      state.researchLoading = false;
      state.error = action.payload as string;
    });
  },
});

// Selectors
export const selectAllKeywords = (state: RootState) => state.keywords.keywords;
export const selectSelectedKeyword = (state: RootState) => state.keywords.selectedKeyword;
export const selectKeywordsLoading = (state: RootState) => state.keywords.loading;
export const selectKeywordsError = (state: RootState) => state.keywords.error;
export const selectResearchResults = (state: RootState) => state.keywords.researchResults;
export const selectResearchLoading = (state: RootState) => state.keywords.researchLoading;

// Actions
export const { selectKeyword, clearSelectedKeyword, clearResearchResults } = keywordsSlice.actions;

// Reducer
export default keywordsSlice.reducer;