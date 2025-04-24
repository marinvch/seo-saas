import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define project types from Prisma schema
export enum ProjectType {
  WEBSITE = 'WEBSITE',
  BLOG = 'BLOG',
  ECOMMERCE = 'ECOMMERCE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
}

// Project interface matching Prisma schema
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

// Interface for the project state slice
interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    organizationId: string | null;
    type: ProjectType | null;
    searchQuery: string;
  };
}

// Initial state for projects slice
const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  filters: {
    organizationId: null,
    type: null,
    searchQuery: '',
  },
};

// Async thunk for fetching projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (organizationId: string | undefined, { rejectWithValue }) => {
    try {
      const url = organizationId 
        ? `/api/organizations/${organizationId}/projects` 
        : '/api/projects';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      return data.projects;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch projects');
    }
  }
);

// Async thunk for fetching a single project
export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch project');
    }
  }
);

// Async thunk for creating a project
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create project');
    }
  }
);

// Projects slice for managing project data
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    // Set current project
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    
    // Update filters
    setOrganizationFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.organizationId = action.payload;
    },
    
    setTypeFilter: (state, action: PayloadAction<ProjectType | null>) => {
      state.filters.type = action.payload;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },
    
    // Clear all filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    // Fetch projects cases
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch project by ID cases
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create project cases
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.push(action.payload);
        state.currentProject = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const {
  setCurrentProject,
  setOrganizationFilter,
  setTypeFilter,
  setSearchQuery,
  clearFilters,
} = projectsSlice.actions;

// Selector to get filtered projects
export const selectFilteredProjects = (state: RootState) => {
  const { projects, filters } = state.projects;
  
  return projects.filter(project => {
    // Filter by organization
    if (filters.organizationId && project.organizationId !== filters.organizationId) {
      return false;
    }
    
    // Filter by type
    if (filters.type && project.type !== filters.type) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(query) ||
        project.url.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
};

export default projectsSlice.reducer;