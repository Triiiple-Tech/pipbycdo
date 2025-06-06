// Core type definitions for PIP AI application
// These types align with the backend FastAPI models and database schema

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: 'active' | 'completed' | 'archived';
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  project_id?: string;
  user_id: string;
  metadata?: Record<string, any>;
  agent_type?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  project_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  status: 'active' | 'completed' | 'archived';
}

export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  url: string;
  project_id?: string;
  user_id: string;
  created_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  type: 'text_extraction' | 'cost_estimation' | 'qa_validation' | 'smartsheet_sync' | 'admin' | 'analytics' | 'file_processing' | 'general';
  status: 'idle' | 'processing' | 'error' | 'offline';
  description: string;
  capabilities: string[];
  current_task?: string;
  last_active: string;
  performance_metrics?: {
    tasks_completed: number;
    average_response_time: number;
    success_rate: number;
  };
}

export interface SmartsheetConfig {
  id: string;
  name: string;
  sheet_id: string;
  access_token: string;
  column_mappings: Record<string, string>;
  sync_enabled: boolean;
  last_sync: string;
  user_id: string;
}

export interface AnalyticsData {
  total_documents: number;
  total_cost_estimates: number;
  avg_processing_time: number;
  success_rate: number;
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  agent_performance: Array<{
    agent_id: string;
    tasks_completed: number;
    avg_response_time: number;
    success_rate: number;
  }>;
}

export interface ProcessingJob {
  id: string;
  type: 'document_analysis' | 'cost_estimation' | 'smartsheet_sync';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  file_id?: string;
  project_id?: string;
  user_id: string;
  progress: number;
  result?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  template_type: string;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_public: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'agent_status' | 'job_progress' | 'chat_message' | 'notification';
  data: any;
  timestamp: string;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface ProjectForm {
  name: string;
  description?: string;
}

export interface ChatForm {
  message: string;
  project_id?: string;
}

export interface FileUploadForm {
  files: File[];
  project_id?: string;
}

export interface SmartsheetConfigForm {
  name: string;
  sheet_id: string;
  access_token: string;
  column_mappings: Record<string, string>;
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  auto_save: boolean;
  default_project_id?: string;
}

export interface AdminSettings {
  max_file_size: number;
  allowed_file_types: string[];
  api_rate_limit: number;
  maintenance_mode: boolean;
}
