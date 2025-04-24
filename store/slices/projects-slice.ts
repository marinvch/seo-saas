import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProjectType } from '@prisma/client';

export interface Project {
  id: string;
  name: string;
  url: string;
  type: ProjectType;
  organizationId: string;
  createdById: string;
  targetCountry?: string | null;
  targetLanguage?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (organizationId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    selectProject: (state, action: PayloadAction<string>) => {
      state.selectedProject = state.projects.find(project => project.id === action.payload) || null;
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectProject, clearSelectedProject } = projectsSlice.actions;
export const projectsReducer = projectsSlice.reducer;