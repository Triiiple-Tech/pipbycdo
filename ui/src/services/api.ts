// API service for connecting to the PipByCDO backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AnalyzeRequest {
  query?: string;
  content?: string;
  user_id?: string;
  session_id?: string;
  files?: File[];
}

export interface AnalyzeResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface TaskStatusResponse {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressUpdate { // Added ProgressUpdate interface
  task_id: string;
  status: 'in_progress' | 'processing_step'; // Or more specific statuses
  message?: string; // General status message
  current_agent?: string; // Name of the agent currently working
  status_message?: string; // Specific message from the current agent
  progress?: number; // Optional overall progress (0-100)
  // any other relevant progress fields
}

export interface AgentTrace {
  agent: string;
  decision: string;
  details: string; // This might be the 'message' expected in Index.tsx
  message?: string; // Explicitly add if different from details
  timestamp: string;
  level: string;
  duration?: number; // Add duration if backend can provide it per trace
}

export interface ProcessedState {
  query?: string;
  processed_files_content?: Record<string, string>;
  trade_mapping?: any[];
  scope_items?: any[];
  takeoff_data?: any[];
  estimate?: any[];
  agent_trace?: AgentTrace[];
  meeting_log?: any[];
  error?: string;
}

export interface CompressionEstimateResponse {
  original_size: number;
  estimated_compressed_size: number;
  estimated_compression_ratio: number;
  estimated_processing_time: number;
  quality_setting: string;
  is_compressible: boolean;
}

export interface CompressionResponse {
  compressed_file: Blob;
  original_size: number;
  compressed_size: number;
  compression_ratio: number;
  quality_setting: string;
  compression_status: string;
}

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    const headers: HeadersInit = {
      'Accept': 'application/json',
      ...options.headers,
    };
    
    // Only add Content-Type if it's not FormData
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest('/health');
  }

  async submitAnalysis(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const formData = new FormData();
    
    if (request.query) formData.append('query', request.query);
    if (request.content) formData.append('content', request.content);
    if (request.user_id) formData.append('user_id', request.user_id);
    if (request.session_id) formData.append('session_id', request.session_id);
    
    if (request.files) {
      request.files.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.makeRequest('/api/analyze', {
      method: 'POST',
      headers: {
        'X-Internal-Code': 'hermes',
      },
      body: formData,
    });
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    return this.makeRequest(`/api/tasks/${taskId}/status`);
  }

  async pollTaskStatus(
    taskId: string, 
    onUpdate: (status: TaskStatusResponse) => void,
    onComplete: (result: ProcessedState) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const poll = async () => {
      try {
        const status = await this.getTaskStatus(taskId);
        onUpdate(status);

        if (status.status === 'completed') {
          onComplete(status.result || {});
        } else if (status.status === 'failed') {
          onError(status.error || 'Unknown error');
        } else {
          // Continue polling
          setTimeout(poll, 1000);
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    poll();
  }

  async compressFile(file: File, quality: 'high' | 'medium' | 'low' = 'medium'): Promise<CompressionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality);

    const response = await fetch(`${API_BASE_URL}/api/compress-file`, {
      method: 'POST',
      headers: {
        'X-Internal-Code': 'hermes',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Compression failed: ${response.status} ${response.statusText}`);
    }

    // Extract compression info from headers
    const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
    const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0');
    const compressionRatio = parseFloat(response.headers.get('X-Compression-Ratio')?.replace('%', '') || '0');
    const qualitySetting = response.headers.get('X-Quality-Setting') || quality;
    const compressionStatus = response.headers.get('X-Compression-Status') || 'unknown';

    // Get the compressed file blob
    const compressedFile = await response.blob();

    return {
      compressed_file: compressedFile,
      original_size: originalSize,
      compressed_size: compressedSize,
      compression_ratio: compressionRatio,
      quality_setting: qualitySetting,
      compression_status: compressionStatus,
    };
  }

  async estimateCompression(file: File, quality: 'high' | 'medium' | 'low' = 'medium'): Promise<CompressionEstimateResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality);

    return this.makeRequest('/api/estimate-compression', {
      method: 'POST',
      headers: {
        'X-Internal-Code': 'hermes',
      },
      body: formData,
    });
  }
}

export const apiService = new ApiService();
