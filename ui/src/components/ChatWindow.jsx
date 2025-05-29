import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-grow p-6 space-y-6 overflow-y-auto bg-gradient-to-b from-white/30 to-white/60 backdrop-blur-sm relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
      </div>
      
      {/* Welcome message for empty state */}
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-glow animate-float">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-2xl font-bold text-gradient mb-3">
              Welcome to PIP AI
            </h3>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              Your intelligent preconstruction assistant is ready to help with cost estimation, 
              RFI generation, document analysis, and more.
            </p>
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="relative z-10 space-y-6">
        {messages.map((msg, index) => (
          <div 
            key={msg.id || index}
            className="animate-slide-up"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <MessageBubble message={msg} />
          </div>
        ))}
      </div>
      
      {/* Scroll target */}
      <div ref={chatEndRef} className="h-4" />
    </div>
  );
};

export default ChatWindow;
