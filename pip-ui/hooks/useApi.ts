// React hooks for API integration
// Provides easy-to-use hooks for common API operations

import { useState, useEffect, useCallback } from 'react';
import { 
  ApiResponse, 
  ChatSession, 
  ChatMessage, 
  Project, 
  FileUpload, 
  Agent, 
  AnalyticsData 
} from '../lib/types';
import { apiClient } from '../services/api';
import { chatApi } from '../services/chatApi';

// Generic hook for API requests
export function useApiRequest<T>(
  requestFn: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    console.log("useApiRequest: Starting execute function...");
    setLoading(true);
    setError(null);
    
    try {
      console.log("useApiRequest: About to call requestFn...");
      const response = await requestFn();
      console.log("useApiRequest: Response received:", response);
      
      if (response.success && response.data) {
        console.log("useApiRequest: Setting data:", response.data);
        setData(response.data);
        console.log("useApiRequest: Data set successfully");
      } else {
        console.error("useApiRequest: API call failed:", response.error);
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error("useApiRequest: Exception caught:", err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      console.log("useApiRequest: Setting loading to false");
      setLoading(false);
    }
  }, [requestFn, ...dependencies]);

  useEffect(() => {
    console.log("useApiRequest: useEffect triggered, calling execute");
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// Projects hooks
export function useProjects() {
  return useApiRequest(() => apiClient.getProjects());
}

export function useProject(id: string) {
  return useApiRequest(() => apiClient.getProject(id), [id]);
}

// Chat hooks
export function useChatSessions(projectId?: string) {
  console.log("useChatSessions called with projectId:", projectId);
  
  return useApiRequest(
    useCallback(() => {
      console.log("useChatSessions requestFn called, calling apiClient.getChatSessions");
      return apiClient.getChatSessions(projectId);
    }, [projectId]),
    [projectId]
  );
}

export function useChatSession(sessionId: string) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const loadSession = async () => {
      setLoading(true);
      setError(null);

      try {
        const [sessionResponse, messagesResponse] = await Promise.all([
          chatApi.getChatSession(sessionId),
          chatApi.getMessages(sessionId),
        ]);

        if (sessionResponse.success && sessionResponse.data) {
          setSession(sessionResponse.data);
        } else {
          setError(sessionResponse.error || 'Failed to load session');
        }

        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Set up WebSocket listener for real-time messages
    const handleWebSocketMessage = (wsMessage: any) => {
      if (wsMessage.type === 'chat_message' && wsMessage.data.session_id === sessionId) {
        setMessages(prev => [...prev, wsMessage.data]);
      }
    };

    chatApi.onMessage(`chat-session-${sessionId}`, handleWebSocketMessage);

    return () => {
      chatApi.offMessage(`chat-session-${sessionId}`);
    };
  }, [sessionId]);

  const sendMessage = async (content: string) => {
    const response = await chatApi.sendMessage(sessionId, content);
    if (response.success && response.data) {
      setMessages(prev => [...prev, response.data!]);
    }
    return response;
  };

  return { session, messages, loading, error, sendMessage };
}

// Files hooks
export function useFiles(projectId?: string) {
  return useApiRequest(() => apiClient.getFiles(projectId), [projectId]);
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: File[], projectId?: string): Promise<FileUpload[] | null> => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress for now - in real implementation, you'd track actual upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await apiClient.uploadFiles(files, projectId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Upload failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return { uploadFiles, uploading, uploadProgress, error };
}

// Agents hooks
export function useAgents() {
  return useApiRequest(() => apiClient.getAgents());
}

export function useAgentStatus() {
  const [agentStatus, setAgentStatus] = useState<Record<string, Agent>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgentStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getAgentStatus();
        if (response.success && response.data) {
          setAgentStatus(response.data);
        } else {
          setError(response.error || 'Failed to load agent status');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadAgentStatus();

    // Set up WebSocket listener for real-time agent status updates
    const handleWebSocketMessage = (wsMessage: any) => {
      if (wsMessage.type === 'agent_status') {
        setAgentStatus(prev => ({
          ...prev,
          [wsMessage.data.id]: wsMessage.data,
        }));
      }
    };

    chatApi.onMessage('agent-status', handleWebSocketMessage);

    // Refresh agent status every 30 seconds
    const interval = setInterval(loadAgentStatus, 30000);

    return () => {
      chatApi.offMessage('agent-status');
      clearInterval(interval);
    };
  }, []);

  return { agentStatus, loading, error };
}

// Analytics hooks
export function useAnalytics() {
  return useApiRequest(() => apiClient.getAnalytics());
}

export function useDashboardStats() {
  return useApiRequest(() => apiClient.getDashboardStats());
}

// Templates hooks
export function useTemplates() {
  return useApiRequest(() => apiClient.getTemplates());
}

// Generic mutation hook for create/update/delete operations
export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (params: P): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await mutationFn(params);
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Mutation failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mutation failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
