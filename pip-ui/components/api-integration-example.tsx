// Example component demonstrating API integration
// This shows how to use the new API layer with the React hooks

"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Upload, Activity } from 'lucide-react';
import { 
  useChatSessions, 
  useAgentStatus, 
  useAnalytics, 
  useFileUpload,
  useMutation 
} from '@/hooks/useApi';
import { chatApi } from '@/services/chatApi';
import { apiClient } from '@/services/api';
import { ChatSession, Agent } from '@/lib/types';

export function ApiIntegrationExample() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [newChatName, setNewChatName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeSession, setActiveSession] = useState<string>('');

  // Using our new API hooks
  const { data: chatSessions, loading: chatsLoading, error: chatsError, refetch: refetchChats } = useChatSessions();
  const { agentStatus, loading: agentsLoading } = useAgentStatus();
  const { data: analytics, loading: analyticsLoading } = useAnalytics();
  const { uploadFiles, uploading, uploadProgress } = useFileUpload();

  // Mutation hooks for create/update operations
  const { mutate: createChat, loading: creatingChat } = useMutation(
    (params: { name: string; project_id?: string }) => 
      chatApi.createChatSession(params.name, params.project_id)
  );

  const { mutate: sendMessage, loading: sendingMessage } = useMutation(
    (params: { sessionId: string; message: string }) =>
      chatApi.sendMessage(params.sessionId, params.message)
  );

  // Handle file uploads
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const result = await uploadFiles(fileArray, selectedProject);
    
    if (result) {
      console.log('Files uploaded successfully:', result);
      // You could trigger a refetch of files here
    }
  };

  // Handle creating a new chat session
  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;
    
    const result = await createChat({ 
      name: newChatName, 
      project_id: selectedProject || undefined 
    });
    
    if (result) {
      setNewChatName('');
      refetchChats(); // Refresh the chat list
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;
    
    const result = await sendMessage({ 
      sessionId: activeSession, 
      message: newMessage 
    });
    
    if (result) {
      setNewMessage('');
      // Message will be added to the session via WebSocket
    }
  };

  // Render agent status badges
  const renderAgentStatus = (agents: Record<string, Agent>) => {
    return Object.values(agents).map(agent => (
      <Badge 
        key={agent.id} 
        variant={agent.status === 'idle' ? 'secondary' : agent.status === 'processing' ? 'default' : 'destructive'}
        className="mr-2 mb-2"
      >
        <Activity className="w-3 h-3 mr-1" />
        {agent.name}: {agent.status}
      </Badge>
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">API Integration Example</h1>
      
      {/* Analytics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading analytics...</span>
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.total_documents}</div>
                <div className="text-sm text-muted-foreground">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.total_cost_estimates}</div>
                <div className="text-sm text-muted-foreground">Cost Estimates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.avg_processing_time}s</div>
                <div className="text-sm text-muted-foreground">Avg Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{(analytics.success_rate * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No analytics data available</p>
          )}
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading agent status...</span>
            </div>
          ) : Object.keys(agentStatus).length > 0 ? (
            <div className="flex flex-wrap">
              {renderAgentStatus(agentStatus)}
            </div>
          ) : (
            <p className="text-muted-foreground">No agents available</p>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading... {uploadProgress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Chat */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Chat name"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
              />
              <Button 
                onClick={handleCreateChat}
                disabled={creatingChat || !newChatName.trim()}
                className="w-full"
              >
                {creatingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create Chat
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Chat Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {chatsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading chats...</span>
              </div>
            ) : chatsError ? (
              <p className="text-destructive">Error: {chatsError}</p>
            ) : chatSessions && chatSessions.length > 0 ? (
              <div className="space-y-2">
                {chatSessions.map((session: ChatSession) => (
                  <div 
                    key={session.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      activeSession === session.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setActiveSession(session.id)}
                  >
                    <h4 className="font-medium">{session.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {session.messages?.length || 0} messages
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No chat sessions available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Message */}
      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                className="w-full"
              >
                {sendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
