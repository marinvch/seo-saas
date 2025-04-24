import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ProjectType, ProjectSettings } from '@prisma/client';

interface ProjectData {
  name: string;
  url: string;
  type: ProjectType;
  targetCountry?: string;
  targetLanguage?: string;
  organizationId: string;
}

interface Project extends ProjectData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  projectSettings?: ProjectSettings;
}

interface ProjectsState {
  items: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  items: [],
  selectedProject: null,
  loading: false,
  error: null,
};

export const createProject = createAsyncThunk(
  'projects/create',
  async (data: ProjectData) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create project');
    }

    return response.json();
  }
);

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (organizationId?: string) => {
    const url = organizationId 
      ? `/api/projects?organizationId=${organizationId}`
      : '/api/projects';
      
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch projects');
    }

    return response.json();
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch project');
    }

    return response.json();
  }
);

interface UpdateProjectData {
  projectId: string;
  data: {
    name?: string;
    url?: string;
    type?: ProjectType;
    targetCountry?: string;
    targetLanguage?: string;
    projectSettings?: Partial<ProjectSettings>;
  };
}

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ projectId, data }: UpdateProjectData) => {
    let response;
    
    if (data.projectSettings) {
      // Update project settings
      response = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.projectSettings),
      });
    } else {
      // Update project details
      response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update project');
    }

    return response.json();
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete project');
    }

    return projectId;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.selectedProject = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create project';
      })
      // Fetch All Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      // Fetch Project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProject = action.payload;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch project';
      })
      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...action.payload
          };
        }
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = {
            ...state.selectedProject,
            ...action.payload
          };
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update project';
      })
      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(p => p.id !== action.payload);
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete project';
      });
  },
});

export const { clearSelectedProject, setError } = projectsSlice.actions;

// Selectors
export const selectAllProjects = (state: RootState) => state.projects.items;
export const selectSelectedProject = (state: RootState) => state.projects.selectedProject;
export const selectProjectsLoading = (state: RootState) => state.projects.loading;
export const selectProjectsError = (state: RootState) => state.projects.error;

export default projectsSlice.reducer;