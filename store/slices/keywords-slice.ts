import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Keyword interface matching Prisma schema
export interface Keyword {
  id: string;
  projectId: string;
  keyword: string;
  volume?: number | null;
  difficulty?: number | null;
  cpc?: number | null;
  intent?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Rank tracking interface matching Prisma schema
export interface RankTracking {
  id: string;
  projectId: string;
  keywordId: string;
  rank?: number | null;
  previousRank?: number | null;
  change?: number | null;
  url?: string | null;
  date: string;
  searchEngine: string;
}

// Keyword research result interface
export interface KeywordResearchResult {
  keyword: string;
  volume?: number | null;
  difficulty?: number | null;
  cpc?: number | null;
  intent?: string | null;
  relatedKeywords?: string[];
}

// Interface for keywords state slice
interface KeywordsState {
  keywords: Keyword[];
  selectedKeywords: string[]; // Array of keyword IDs
  rankHistory: RankTracking[];
  researchResults: KeywordResearchResult[];
  filters: {
    searchQuery: string;
    minVolume?: number;
    maxVolume?: number;
    minDifficulty?: number;
    maxDifficulty?: number;
    intent?: string[];
  };
  isLoading: boolean;
  isResearching: boolean;
  error: string | null;
}

// Initial state for keywords slice
const initialState: KeywordsState = {
  keywords: [],
  selectedKeywords: [],
  rankHistory: [],
  researchResults: [],
  filters: {
    searchQuery: '',
    minVolume: undefined,
    maxVolume: undefined,
    minDifficulty: undefined,
    maxDifficulty: undefined,
    intent: undefined,
  },
  isLoading: false,
  isResearching: false,
  error: null,
};

// Async thunk for fetching keywords for a project
export const fetchProjectKeywords = createAsyncThunk(
  'keywords/fetchProjectKeywords',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project keywords');
      }
      
      const data = await response.json();
      return data.keywords;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch project keywords');
    }
  }
);

// Async thunk for adding a keyword to a project
export const addKeyword = createAsyncThunk(
  'keywords/addKeyword',
  async (keywordData: { projectId: string; keyword: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${keywordData.projectId}/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keywordData.keyword }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add keyword');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add keyword');
    }
  }
);

// Async thunk for bulk adding keywords
export const bulkAddKeywords = createAsyncThunk(
  'keywords/bulkAddKeywords',
  async (keywordData: { projectId: string; keywords: string[] }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${keywordData.projectId}/keywords/bulk-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords: keywordData.keywords }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to bulk add keywords');
      }
      
      const data = await response.json();
      return data.keywords;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk add keywords');
    }
  }
);

// Async thunk for performing keyword research
export const researchKeywords = createAsyncThunk(
  'keywords/researchKeywords',
  async (
    researchData: { 
      projectId: string; 
      seed: string; 
      options?: { 
        country?: string; 
        language?: string; 
        limit?: number;
      }
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/projects/${researchData.projectId}/keywords/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seed: researchData.seed,
          options: researchData.options || {},
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to research keywords');
      }
      
      const data = await response.json();
      return data.results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to research keywords');
    }
  }
);

// Async thunk for fetching rank tracking data
export const fetchKeywordRankings = createAsyncThunk(
  'keywords/fetchKeywordRankings',
  async ({ projectId, keywordId, period = 30 }: { projectId: string; keywordId?: string; period?: number }, { rejectWithValue }) => {
    try {
      const url = keywordId
        ? `/api/projects/${projectId}/keywords/${keywordId}/rankings?period=${period}`
        : `/api/projects/${projectId}/keywords/rankings?period=${period}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch keyword rankings');
      }
      
      const data = await response.json();
      return data.rankings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch keyword rankings');
    }
  }
);

// Keywords slice for managing keyword data
const keywordsSlice = createSlice({
  name: 'keywords',
  initialState,
  reducers: {
    // Update selected keywords
    selectKeyword: (state, action: PayloadAction<string>) => {
      if (!state.selectedKeywords.includes(action.payload)) {
        state.selectedKeywords.push(action.payload);
      }
    },
    
    deselectKeyword: (state, action: PayloadAction<string>) => {
      state.selectedKeywords = state.selectedKeywords.filter(id => id !== action.payload);
    },
    
    clearSelectedKeywords: (state) => {
      state.selectedKeywords = [];
    },
    
    // Update filters
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },
    
    setVolumeFilter: (state, action: PayloadAction<{ min?: number; max?: number }>) => {
      state.filters.minVolume = action.payload.min;
      state.filters.maxVolume = action.payload.max;
    },
    
    setDifficultyFilter: (state, action: PayloadAction<{ min?: number; max?: number }>) => {
      state.filters.minDifficulty = action.payload.min;
      state.filters.maxDifficulty = action.payload.max;
    },
    
    setIntentFilter: (state, action: PayloadAction<string[] | undefined>) => {
      state.filters.intent = action.payload;
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Clear research results
    clearResearchResults: (state) => {
      state.researchResults = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch project keywords cases
    builder
      .addCase(fetchProjectKeywords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectKeywords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.keywords = action.payload;
      })
      .addCase(fetchProjectKeywords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Add keyword cases
      .addCase(addKeyword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addKeyword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.keywords.push(action.payload);
      })
      .addCase(addKeyword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Bulk add keywords cases
      .addCase(bulkAddKeywords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkAddKeywords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.keywords = [...state.keywords, ...action.payload];
      })
      .addCase(bulkAddKeywords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Research keywords cases
      .addCase(researchKeywords.pending, (state) => {
        state.isResearching = true;
        state.error = null;
      })
      .addCase(researchKeywords.fulfilled, (state, action) => {
        state.isResearching = false;
        state.researchResults = action.payload;
      })
      .addCase(researchKeywords.rejected, (state, action) => {
        state.isResearching = false;
        state.error = action.payload as string;
      })
      
      // Fetch keyword rankings cases
      .addCase(fetchKeywordRankings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchKeywordRankings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rankHistory = action.payload;
      })
      .addCase(fetchKeywordRankings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const {
  selectKeyword,
  deselectKeyword,
  clearSelectedKeywords,
  setSearchQuery,
  setVolumeFilter,
  setDifficultyFilter,
  setIntentFilter,
  clearFilters,
  clearResearchResults,
} = keywordsSlice.actions;

// Selectors
export const selectFilteredKeywords = (state: RootState) => {
  const { keywords, filters } = state.keywords;
  
  return keywords.filter(keyword => {
    // Filter by search query
    if (filters.searchQuery && !keyword.keyword.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by volume
    if (filters.minVolume !== undefined && keyword.volume !== null && keyword.volume < filters.minVolume) {
      return false;
    }
    if (filters.maxVolume !== undefined && keyword.volume !== null && keyword.volume > filters.maxVolume) {
      return false;
    }
    
    // Filter by difficulty
    if (filters.minDifficulty !== undefined && keyword.difficulty !== null && keyword.difficulty < filters.minDifficulty) {
      return false;
    }
    if (filters.maxDifficulty !== undefined && keyword.difficulty !== null && keyword.difficulty > filters.maxDifficulty) {
      return false;
    }
    
    // Filter by intent
    if (filters.intent && filters.intent.length > 0 && keyword.intent) {
      return filters.intent.includes(keyword.intent);
    }
    
    return true;
  });
};

export default keywordsSlice.reducer;