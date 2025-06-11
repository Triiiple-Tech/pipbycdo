// Main API service for PIP AI application
// Handles all HTTP requests to the FastAPI backend

import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  Project, 
  ChatSession, 
  ChatMessage, 
  FileUpload, 
  Agent, 
  AnalyticsData, 
  ProcessingJob, 
  Template,
  SmartsheetConfig 
} from '@/lib/types';

// Base configuration - Using Next.js Proxy
const API_BASE_URL = '/api/proxy';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Internal-Code': 'hermes',
    };
  }

  // Helper method for making requests
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Convert backend endpoint to proxy endpoint
      // Remove leading /api if present since we're routing through proxy
      const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
      const url = `${this.baseUrl}${cleanEndpoint}`;
      
      console.log("API request: Making proxied fetch to URL:", url);
      console.log("API request: Original endpoint:", endpoint);
      console.log("API request: Clean endpoint:", cleanEndpoint);
      console.log("API request: Options:", options);
      console.log("API request: Headers:", { ...this.defaultHeaders, ...options.headers });
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      });

      console.log("API request: Proxied fetch response received:", response);
      console.log("API request: Response status:", response.status);
      console.log("API request: Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API request: Error response body:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      console.log("API request: About to parse JSON...");
      const data = await response.json();
      console.log("API request: JSON parsed successfully:", data);
      console.log("API request: Data type:", typeof data);
      console.log("API request: Data is array:", Array.isArray(data));
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Make request method accessible for other services
  public async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request(endpoint, options);
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/api/auth/me');
  }

  // Project methods
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request('/api/projects');
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(data: { name: string; description?: string }): Promise<ApiResponse<Project>> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/projects/${id}`, { method: 'DELETE' });
  }

  // Chat methods
  async getChatSessions(projectId?: string): Promise<ApiResponse<ChatSession[]>> {
    console.log("🔥 apiClient.getChatSessions called with projectId:", projectId);
    const params = projectId ? `?project_id=${projectId}` : '';
    const endpoint = `/api/chat/sessions${params}`;
    console.log("🔥 apiClient.getChatSessions: About to call request with endpoint:", endpoint);
    console.log("🔥 apiClient.getChatSessions: Base URL is:", this.baseUrl);
    console.log("🔥 apiClient.getChatSessions: Full URL will be:", `${this.baseUrl}${endpoint}`);
    
    // Add extra debugging
    console.log("🔥 apiClient.getChatSessions: Headers will be:", this.defaultHeaders);
    console.log("🔥 apiClient.getChatSessions: About to call this.request...");
    
    const result = await this.request<ChatSession[]>(endpoint);
    
    console.log("🔥 apiClient.getChatSessions: Result received:", result);
    console.log("🔥 apiClient.getChatSessions: Result success:", result.success);
    console.log("🔥 apiClient.getChatSessions: Result data:", result.data);
    console.log("🔥 apiClient.getChatSessions: Result data type:", typeof result.data);
    console.log("🔥 apiClient.getChatSessions: Result data is array:", Array.isArray(result.data));
    console.log("🔥 apiClient.getChatSessions: Result data length:", result.data?.length);
    
    return result;
  }

  async getChatSession(id: string): Promise<ApiResponse<ChatSession>> {
    return this.request(`/api/chat/sessions/${id}`);
  }

  async createChatSession(data: { name: string; project_id?: string }): Promise<ApiResponse<ChatSession>> {
    return this.request('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendChatMessage(sessionId: string, message: string): Promise<ApiResponse<ChatMessage[]>> {
    const response = await this.request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: message }),
    });
    
    // Handle the new response format with both user and agent messages
    if (response.data && typeof response.data === 'object' && 'user_message' in response.data) {
      const chatResponse = response.data as any;
      const messages: ChatMessage[] = [chatResponse.user_message];
      if (chatResponse.agent_response) {
        messages.push(chatResponse.agent_response);
      }
      return {
        ...response,
        data: messages
      };
    }
    
    // Fallback for single message response (backward compatibility)
    return {
      ...response,
      data: response.data ? [response.data as ChatMessage] : []
    };
  }

  async getChatMessages(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.request(`/api/chat/sessions/${sessionId}/messages`);
  }

  // File methods
  async uploadFiles(files: File[], projectId?: string): Promise<ApiResponse<FileUpload[]>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (projectId) formData.append('project_id', projectId);

    return this.request('/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  async getFiles(projectId?: string): Promise<ApiResponse<FileUpload[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.request(`/api/files${params}`);
  }

  async getFile(id: string): Promise<ApiResponse<FileUpload>> {
    return this.request(`/api/files/${id}`);
  }

  async deleteFile(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/files/${id}`, { method: 'DELETE' });
  }

  // Document analysis (existing endpoint)
  async analyzeDocument(fileId: string): Promise<ApiResponse<any>> {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ file_id: fileId }),
    });
  }

  // Agent methods
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.request('/api/agents');
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request(`/api/agents/${id}`);
  }

  async getAgentStatus(): Promise<ApiResponse<Record<string, Agent>>> {
    return this.request('/api/agents/status');
  }

  // Processing jobs
  async getProcessingJobs(limit?: number): Promise<ApiResponse<ProcessingJob[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/api/jobs${params}`);
  }

  async getProcessingJob(id: string): Promise<ApiResponse<ProcessingJob>> {
    return this.request(`/api/jobs/${id}`);
  }

  // Analytics (existing endpoints)
  async getAnalytics(): Promise<ApiResponse<AnalyticsData>> {
    return this.request('/api/analytics');
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/api/analytics/dashboard');
  }

  async getUsageStats(): Promise<ApiResponse<any>> {
    return this.request('/api/analytics/usage');
  }

  // Templates (existing endpoints) 
  async getTemplates(): Promise<ApiResponse<Template[]>> {
    return this.request('/api/templates');
  }

  async getTemplate(id: string): Promise<ApiResponse<Template>> {
    return this.request(`/api/templates/${id}`);
  }

  async createTemplate(data: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ApiResponse<Template>> {
    return this.request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Smartsheet integration
  async getSmartsheetConfigs(): Promise<ApiResponse<SmartsheetConfig[]>> {
    return this.request('/api/smartsheet/configs');
  }

  async createSmartsheetConfig(data: Omit<SmartsheetConfig, 'id' | 'user_id' | 'last_sync'>): Promise<ApiResponse<SmartsheetConfig>> {
    return this.request('/api/smartsheet/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncSmartsheet(configId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/smartsheet/configs/${configId}/sync`, {
      method: 'POST',
    });
  }

  // Admin methods
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/api/admin/users');
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getSystemSettings(): Promise<ApiResponse<any>> {
    return this.request('/api/admin/settings');
  }

  async updateSystemSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing purposes
export { ApiClient };
