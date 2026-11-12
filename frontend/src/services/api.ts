const API_BASE = '/api/v1';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  is_platform_admin: boolean;
  created_at: string;
}

export interface ActiveWorkspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  active_workspace?: ActiveWorkspace;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan_tier: string;
  role?: string;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  default_branch: string;
  primary_language?: string;
  framework?: string;
  recovery_status: string;
  repository?: {
    id: string;
    clone_url: string;
    is_private: boolean;
    default_branch: string;
  };
  created_at: string;
}

class ApiService {
  private token: string | null = localStorage.getItem('fiixo_access_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('fiixo_access_token', token);
    } else {
      localStorage.removeItem('fiixo_access_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('fiixo_access_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'API request failed');
    }

    return data;
  }

  // Auth
  async register(payload: { email: string; password: string; full_name?: string; workspace_name?: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.access_token);
    return res;
  }

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>('/workspaces');
  }

  async createWorkspace(payload: { name: string; slug?: string }): Promise<Workspace> {
    return this.request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Projects
  async listProjects(workspaceId: string): Promise<Project[]> {
    return this.request<Project[]>(`/workspaces/${workspaceId}/projects`);
  }

  async createProject(workspaceId: string, payload: {
    name: string;
    description?: string;
    repository?: { clone_url: string; default_branch?: string; is_private?: boolean };
  }): Promise<Project> {
    return this.request<Project>(`/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // GitHub Integration
  async getGitHubStatus(): Promise<{ connected: boolean; github_username?: string }> {
    return this.request<{ connected: boolean; github_username?: string }>('/integrations/github/status');
  }
}

export const api = new ApiService();
