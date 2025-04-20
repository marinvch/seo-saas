import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

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

interface RankingData {
  keywordId: string;
  ranks: {
    date: string;
    rank: number;
    previousRank?: number;
    url?: string;
  }[];
}

interface KeywordsState {
  keywords: Keyword[];
  rankingData: Record<string, RankingData>;
  isLoading: boolean;
  error: string | null;
}

const initialState: KeywordsState = {
  keywords: [],
  rankingData: {},
  isLoading: false,
  error: null,
};

export const fetchKeywords = createAsyncThunk(
  'keywords/fetchKeywords',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`);
      if (!response.ok) {
        throw new Error('Failed to fetch keywords');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchKeywordRankings = createAsyncThunk(
  'keywords/fetchKeywordRankings',
  async ({ projectId, keywordId }: { projectId: string; keywordId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords/${keywordId}/rankings`);
      if (!response.ok) {
        throw new Error('Failed to fetch keyword rankings');
      }
      const data = await response.json();
      return { keywordId, ranks: data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const keywordsSlice = createSlice({
  name: 'keywords',
  initialState,
  reducers: {
    addKeyword: (state, action: PayloadAction<Keyword>) => {
      state.keywords.push(action.payload);
    },
    removeKeyword: (state, action: PayloadAction<string>) => {
      state.keywords = state.keywords.filter(keyword => keyword.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKeywords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchKeywords.fulfilled, (state, action: PayloadAction<Keyword[]>) => {
        state.isLoading = false;
        state.keywords = action.payload;
      })
      .addCase(fetchKeywords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchKeywordRankings.fulfilled, (state, action) => {
        const { keywordId, ranks } = action.payload;
        state.rankingData[keywordId] = {
          keywordId,
          ranks,
        };
      });
  },
});

export const { addKeyword, removeKeyword } = keywordsSlice.actions;
export const keywordsReducer = keywordsSlice.reducer;