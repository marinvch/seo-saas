import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface RankingData {
  id: string;
  projectId: string;
  keywordId: string;
  rank: number | null;
  previousRank: number | null;
  change: number | null;
  url: string | null;
  date: string;
  searchEngine: string;
  keyword?: string; // For UI display purposes
}

export interface RankTrackingSummary {
  averagePosition: number | null;
  keywordsInTop10: number;
  totalKeywords: number;
  lastUpdated: string | null;
}

export interface RankTrackingState {
  rankings: RankingData[];
  summary: RankTrackingSummary;
  loading: boolean;
  checkingRankings: boolean;
  error: string | null;
}

// Initial state
const initialState: RankTrackingState = {
  rankings: [],
  summary: {
    averagePosition: null,
    keywordsInTop10: 0,
    totalKeywords: 0,
    lastUpdated: null,
  },
  loading: false,
  checkingRankings: false,
  error: null,
};

// Async thunks
export const fetchRankings = createAsyncThunk(
  'rankTracking/fetchRankings',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/rankings`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch keyword rankings');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch keyword rankings');
    }
  }
);

export const checkRankings = createAsyncThunk(
  'rankTracking/checkRankings',
  async ({ projectId, keywordIds }: { projectId: string; keywordIds: string[] }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/rankings/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywordIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to check rankings');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to check rankings');
    }
  }
);

// Calculate summary statistics from rankings data
const calculateSummary = (rankings: RankingData[]): RankTrackingSummary => {
  if (rankings.length === 0) {
    return {
      averagePosition: null,
      keywordsInTop10: 0,
      totalKeywords: 0,
      lastUpdated: null,
    };
  }

  const ranksWithValues = rankings.filter(r => r.rank !== null);
  const sumOfRanks = ranksWithValues.reduce((sum, r) => sum + (r.rank || 0), 0);
  const top10Count = ranksWithValues.filter(r => r.rank !== null && r.rank <= 10).length;
  
  // Find the most recent date
  const dates = rankings.map(r => new Date(r.date).getTime());
  const mostRecentDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

  return {
    averagePosition: ranksWithValues.length > 0 ? sumOfRanks / ranksWithValues.length : null,
    keywordsInTop10: top10Count,
    totalKeywords: rankings.length,
    lastUpdated: mostRecentDate,
  };
};

// Slice
const rankTrackingSlice = createSlice({
  name: 'rankTracking',
  initialState,
  reducers: {
    clearRankings: (state) => {
      state.rankings = [];
      state.summary = {
        averagePosition: null,
        keywordsInTop10: 0,
        totalKeywords: 0,
        lastUpdated: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch rankings cases
    builder.addCase(fetchRankings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRankings.fulfilled, (state, action) => {
      state.rankings = action.payload;
      state.summary = calculateSummary(action.payload);
      state.loading = false;
    });
    builder.addCase(fetchRankings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Check rankings cases
    builder.addCase(checkRankings.pending, (state) => {
      state.checkingRankings = true;
      state.error = null;
    });
    builder.addCase(checkRankings.fulfilled, (state, action) => {
      // Append new rankings and recalculate summary
      state.rankings = [...state.rankings.filter(r => 
        // Remove any previous rankings for the same keywords to avoid duplicates
        !action.payload.some((newRank: RankingData) => newRank.keywordId === r.keywordId)
      ), ...action.payload];
      
      state.summary = calculateSummary(state.rankings);
      state.checkingRankings = false;
    });
    builder.addCase(checkRankings.rejected, (state, action) => {
      state.checkingRankings = false;
      state.error = action.payload as string;
    });
  },
});

// Selectors
export const selectAllRankings = (state: RootState) => state.rankTracking.rankings;
export const selectRankingSummary = (state: RootState) => state.rankTracking.summary;
export const selectRankTrackingLoading = (state: RootState) => state.rankTracking.loading;
export const selectCheckingRankings = (state: RootState) => state.rankTracking.checkingRankings;
export const selectRankTrackingError = (state: RootState) => state.rankTracking.error;

// Actions
export const { clearRankings } = rankTrackingSlice.actions;

// Reducer
export default rankTrackingSlice.reducer;