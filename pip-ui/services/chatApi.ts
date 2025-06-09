// Chat-specific API service for real-time messaging
// Handles WebSocket connections and chat-related functionality

import { ChatMessage, ChatSession, WebSocketMessage, ApiResponse } from '@/lib/types';
import { apiClient } from '@/services/api';
import config from '@/lib/config';

export class ChatApiService {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();

  constructor() {
    this.initializeWebSocket();
  }

  // WebSocket connection management
  private initializeWebSocket() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/chat/ws';
    
    try {
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        console.log('🔥 RAW WebSocket message received:', event.data);
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('🔥 PARSED WebSocket message:', message);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        // Only reconnect if it wasn't a normal closure
        if (event.code !== 1000) {
          this.handleReconnect();
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't reconnect immediately on error, let onclose handle it
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (attempt ${this.reconnectAttempts})`);
        this.initializeWebSocket();
      }, delay);
    } else {
      console.error('Max WebSocket reconnection attempts reached');
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    console.log('🔥 HANDLING WebSocket message:', message);
    // Notify all registered handlers
    this.messageHandlers.forEach((handler, id) => {
      try {
        console.log('🔥 Calling handler for:', id);
        handler(message);
      } catch (error) {
        console.error('Error in WebSocket message handler:', error);
      }
    });
  }

  // Public methods for WebSocket management
  public onMessage(id: string, handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.set(id, handler);
  }

  public offMessage(id: string) {
    this.messageHandlers.delete(id);
  }

  public disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.messageHandlers.clear();
  }

  // Chat session management
  async createChatSession(name: string, projectId?: string): Promise<ApiResponse<ChatSession>> {
    return apiClient.createChatSession({ name, project_id: projectId });
  }

  async getChatSessions(projectId?: string): Promise<ApiResponse<ChatSession[]>> {
    return apiClient.getChatSessions(projectId);
  }

  async getChatSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return apiClient.getChatSession(sessionId);
  }

  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ApiResponse<ChatSession>> {
    return apiClient.makeRequest(`/api/chat/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteChatSession(sessionId: string): Promise<ApiResponse<void>> {
    // This endpoint needs to be implemented in the backend
    return apiClient.makeRequest(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
  }

  // Message management
  async sendMessage(sessionId: string, content: string): Promise<ApiResponse<ChatMessage>> {
    console.log("🌐 chatApi.sendMessage called with:", { sessionId, content })
    
    const response = await apiClient.sendChatMessage(sessionId, content);
    console.log("🌐 apiClient.sendChatMessage response:", response)
    
    // Also send via WebSocket for real-time updates
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      console.log("🌐 Sending via WebSocket...")
      this.websocket.send(JSON.stringify({
        type: 'chat_message',
        session_id: sessionId,
        content,
        timestamp: new Date().toISOString(),
      }));
    } else {
      console.log("❌ WebSocket not available or not open, state:", this.websocket?.readyState)
    }

    return response;
  }

  async getMessages(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
    return apiClient.getChatMessages(sessionId);
  }

  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    // This endpoint needs to be implemented in the backend
    return apiClient.makeRequest(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
  }

  // Agent interaction
  async sendMessageToAgent(
    sessionId: string, 
    content: string, 
    agentType?: string
  ): Promise<ApiResponse<ChatMessage>> {
    return apiClient.makeRequest(`/api/chat/sessions/${sessionId}/agent`, {
      method: 'POST',
      body: JSON.stringify({ 
        content, 
        agent_type: agentType 
      }),
    });
  }

  // File analysis through chat
  async analyzeFileInChat(
    sessionId: string, 
    fileId: string, 
    instructions?: string
  ): Promise<ApiResponse<ChatMessage>> {
    return apiClient.makeRequest(`/api/chat/sessions/${sessionId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ 
        file_id: fileId, 
        instructions 
      }),
    });
  }

  // Chat export/import
  async exportChatSession(sessionId: string, format: 'json' | 'txt' = 'json'): Promise<ApiResponse<Blob>> {
    // This endpoint needs to be implemented in the backend
    const response = await fetch(`${config.api.baseUrl}/api/chat/sessions/${sessionId}/export?format=${format}`);
    
    if (!response.ok) {
      return {
        success: false,
        error: `Export failed: ${response.status}`,
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
    };
  }

  async importChatSession(file: File, projectId?: string): Promise<ApiResponse<ChatSession>> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', projectId);

    return apiClient.makeRequest('/api/chat/import', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  // Real-time typing indicators
  sendTypingIndicator(sessionId: string, isTyping: boolean) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'typing_indicator',
        session_id: sessionId,
        is_typing: isTyping,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  // Message search
  async searchMessages(
    query: string, 
    sessionId?: string, 
    projectId?: string
  ): Promise<ApiResponse<ChatMessage[]>> {
    const params = new URLSearchParams({ query });
    if (sessionId) params.append('session_id', sessionId);
    if (projectId) params.append('project_id', projectId);

    return apiClient.makeRequest(`/api/chat/search?${params.toString()}`);
  }

  // Chat statistics
  async getChatStats(sessionId?: string): Promise<ApiResponse<any>> {
    const params = sessionId ? `?session_id=${sessionId}` : '';
    return apiClient.makeRequest(`/api/chat/stats${params}`);
  }
}

// Create and export a singleton instance
export const chatApi = new ChatApiService();
