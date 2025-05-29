import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import FilesTab from './components/FilesTab';
import SmartsheetTab from './components/SmartsheetTab';
import HistoryTab from './components/HistoryTab';
import { healthCheck, uploadFiles, getTaskStatus } from './services/api'; // Assuming this service is still relevant

// Mock initial messages for UI development
const initialMessages = [
  {
    id: '1',
    text: 'Welcome to PIP AI! How can I help you with your preconstruction tasks today?',
    sender: 'PIP AI Assistant',
    agent: 'Manager',
    agentType: 'Manager',
    timestamp: Date.now() - 10000,
    isUser: false,
  },
  {
    id: '2',
    text: 'You can upload your plan sets, connect to Smartsheet, or ask me to draft an RFI.',
    sender: 'PIP AI Assistant',
    agent: 'Manager',
    agentType: 'Manager',
    timestamp: Date.now() - 9000,
    isUser: false,
  },
];

// Mock uploaded files for UI development
const initialFiles = [
  { name: 'plan_set_A.pdf', status: 'Ready', type: 'pdf' },
  { name: 'specifications_rev2.docx', status: 'Parsing', type: 'docx' },
  { name: 'BoQ_Template.xlsx', status: 'Error', error: 'Unsupported format', type: 'xlsx' },
];


function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles); // To be managed via API later
  const [activeTab, setActiveTab] = useState('Chat'); // Chat, Files, Smartsheet, History
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // API related states (can be expanded from previous implementation)
  const [healthStatus, setHealthStatus] = useState('loading');
  const [currentTask, setCurrentTask] = useState(null); // For polling, etc.
  const [apiError, setApiError] = useState(null);

  // Perform health check on load (adapted from previous App.jsx)
  useEffect(() => {
    healthCheck()
      .then(response => setHealthStatus(response.data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setHealthStatus('error'));
  }, []);

  const handleSendMessage = (text) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      sender: 'User',
      timestamp: Date.now(),
      isUser: true,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // TODO: Process message, interact with backend agents
    // This is where you'd call your API based on the message content
    // For example, if message is "Estimate plan.pdf"
    // you'd find 'plan.pdf' in uploadedFiles and call an estimate API.

    // Mock agent response for now
    setTimeout(() => {
      const agentResponse = {
        id: (Date.now() + 1).toString(),
        text: `I've received your message: "${text}". I'll get to work!`,
        sender: 'Estimator Agent',
        agent: 'Estimator',
        agentType: 'Estimator',
        timestamp: Date.now(),
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, agentResponse]);
    }, 1000);
  };

  const handleFileUploadFromChat = (files) => {
    // This function would be called from ChatInput
    // It should then call the actual uploadFiles API service
    console.log('Files from ChatInput:', files);
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      status: 'Uploading...', // Initial status
      type: file.type,
      rawFile: file // Keep raw file for actual upload
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate API upload and update status
    newFiles.forEach(async (fileToUpload) => {
      try {
        // Actual API call:
        // const response = await uploadFiles([fileToUpload.rawFile]);
        // const { task_id, status } = response.data;
        // setCurrentTask({ task_id, status, fileName: fileToUpload.name });
        // setUploadedFiles(prev => prev.map(f => f.name === fileToUpload.name ? {...f, status: 'Pending API', taskId: task_id} : f));

        // Mocking upload success for now
        setTimeout(() => {
          setUploadedFiles(prev => prev.map(f =>
            f.name === fileToUpload.name ? { ...f, status: 'Ready', rawFile: undefined } : f
          ));
          setMessages(prev => [...prev, {
            id: Date.now().toString() + fileToUpload.name,
            text: `File uploaded: ${fileToUpload.name}`,
            sender: 'System',
            agent: 'File Manager',
            agentType: 'Manager',
            timestamp: Date.now(),
            isUser: false,
            file: { name: fileToUpload.name }
          }]);
        }, 1500);

      } catch (error) {
        console.error("Error uploading file:", fileToUpload.name, error);
        setUploadedFiles(prev => prev.map(f =>
          f.name === fileToUpload.name ? { ...f, status: 'Error', error: 'Upload failed', rawFile: undefined } : f
        ));
        setApiError(`Failed to upload ${fileToUpload.name}`);
      }
    });
  };


  // Polling logic (can be adapted from previous App.jsx if a task ID is available)
  useEffect(() => {
    let intervalId;
    if (currentTask && currentTask.task_id && currentTask.status === 'pending') { // or 'processing'
      intervalId = setInterval(async () => {
        try {
          const response = await getTaskStatus(currentTask.task_id);
          // Update task status in messages, or in FilesTab, or create a new message
          // For example, find the file in uploadedFiles and update its status
          setUploadedFiles(prevFiles => prevFiles.map(f =>
            f.taskId === currentTask.task_id ? { ...f, status: response.data.status, result: response.data.result, error: response.data.error } : f
          ));

          if (response.data.status === 'completed' || response.data.status === 'failed') {
            clearInterval(intervalId);
            // Add a message to chat about completion/failure
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: `Task for ${currentTask.fileName || 'file'} ${response.data.status}. ${response.data.result ? 'View in Files tab.' : ''} ${response.data.error ? 'Error: ' + response.data.error : ''}`,
              sender: 'System',
              agent: response.data.status === 'completed' ? 'Analyzer' : 'System',
              agentType: response.data.status === 'completed' ? 'Validator' : 'Manager', // Example
              timestamp: Date.now(),
              isUser: false,
            }]);
            setCurrentTask(null);
          }
        } catch (err) {
          console.error('Polling error:', err);
          setApiError('Error checking task status.');
          // Optionally stop polling on repeated errors
        }
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [currentTask]);


  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Chat':
        // ChatWindow and ChatInput are part of the main layout when Chat is active
        return null; // Or some specific content if Chat tab itself has a view beyond the main window
      case 'Files':
        return <FilesTab files={uploadedFiles} />;
      case 'Smartsheet':
        return <SmartsheetTab />;
      case 'History':
        return <HistoryTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 font-sans overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}} />
      </div>

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`
        flex-grow flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isSidebarCollapsed ? 'ml-20' : 'ml-80'}
      `}>
        {/* Enhanced Header */}
        <header className="p-6 bg-white/60 backdrop-blur-xl border-b border-white/30 relative z-10">
          <div className="flex items-center justify-between">
            <div className="animate-slide-right">
              <h2 className="text-2xl font-bold text-gradient">
                {activeTab === 'Chat' ? 'AI Assistant' : activeTab}
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                {activeTab === 'Chat' ? 'Intelligent preconstruction workflow automation' : `Manage your ${activeTab.toLowerCase()}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* API Status */}
              <div className={`
                flex items-center space-x-2 px-4 py-2 rounded-2xl backdrop-blur-sm
                ${healthStatus === 'ok' 
                  ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-100/80 text-red-800 border border-red-200'
                }
              `}>
                <div className={`
                  w-2 h-2 rounded-full animate-pulse
                  ${healthStatus === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}
                `} />
                <span className="text-xs font-semibold">
                  {healthStatus === 'ok' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Current task indicator */}
              {currentTask && (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-primary-100/80 text-primary-800 border border-primary-200 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold">Processing...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Error display */}
          {apiError && (
            <div className="mt-4 p-4 bg-red-100/80 border border-red-200 rounded-2xl backdrop-blur-sm animate-slide-down">
              <p className="text-sm text-red-800 font-medium">{apiError}</p>
            </div>
          )}
        </header>

        {activeTab === 'Chat' ? (
          <div className="flex-grow flex flex-col overflow-hidden relative">
            <ChatWindow messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUploadFromChat} />
          </div>
        ) : (
          <main className="flex-grow p-8 overflow-y-auto bg-white/30 backdrop-blur-sm relative">
            <div className="max-w-6xl mx-auto">
              <div className="glass-panel-heavy rounded-3xl p-8 border-2 border-white/40 shadow-large animate-slide-up">
                {renderActiveTabContent()}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
