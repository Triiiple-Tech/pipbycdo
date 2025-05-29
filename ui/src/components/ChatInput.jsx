import React, { useState, useRef } from 'react';
import { PlusIcon, PaperAirplaneIcon, CommandLineIcon } from '@heroicons/react/24/solid';

const ChatInput = ({ onSendMessage, onFileUpload }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isAttachHovered, setIsAttachHovered] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileUpload(event.target.files);
      event.target.value = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Command palette trigger
    if (e.key === '/' && message === '') {
      e.preventDefault();
      setMessage('/');
      // TODO: Trigger command palette
    }
  };

  return (
    <div className="sticky bottom-0 z-40 bg-gradient-to-t from-white/95 via-white/90 to-white/80 backdrop-blur-2xl border-t border-white/30">
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="relative">
          <div className={`
            flex items-end space-x-4 p-4 rounded-3xl border-2 transition-all duration-300
            glass-panel-heavy floating-panel-subtle
            ${isFocused 
              ? 'border-primary-400/60 shadow-glow-lg scale-[1.02]' 
              : 'border-white/40 hover:border-white/60'
            }
            relative overflow-hidden
          `}>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/40 to-white/60 rounded-3xl" />
            
            {/* Attach Button */}
            <button
              type="button"
              onClick={handleAttachClick}
              onMouseEnter={() => setIsAttachHovered(true)}
              onMouseLeave={() => setIsAttachHovered(false)}
              className={`
                p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden z-10
                ${isAttachHovered 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white scale-110 shadow-glow animate-bounce-gentle' 
                  : 'bg-white/80 text-slate-700 hover:bg-white shadow-soft'
                }
              `}
              aria-label="Attach files or access smart actions"
            >
              {/* Ripple effect */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl scale-0 group-active:scale-100 transition-transform duration-200" />
              
              <PlusIcon className={`
                h-6 w-6 transition-all duration-300 relative z-10
                ${isAttachHovered ? 'rotate-180' : 'group-hover:rotate-90'}
              `} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelected}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
            />

            {/* Text Input Container */}
            <div className="flex-grow relative z-10">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message, mention files, or use / for commands..."
                className={`
                  w-full resize-none bg-transparent focus:outline-none 
                  text-base leading-relaxed placeholder-slate-500
                  transition-all duration-300
                  ${isFocused ? 'placeholder-slate-400' : 'placeholder-slate-500'}
                `}
                rows="1"
                style={{
                  minHeight: '3rem',
                  maxHeight: '10rem',
                }}
              />
              
              {/* Command indicator */}
              {message.startsWith('/') && (
                <div className="absolute right-3 top-3 animate-pulse">
                  <div className="flex items-center space-x-2 bg-primary-100/80 text-primary-700 px-3 py-1 rounded-full backdrop-blur-sm">
                    <CommandLineIcon className="h-4 w-4" />
                    <span className="text-xs font-semibold">Command Mode</span>
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim()}
              className={`
                p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden z-10
                ${message.trim() 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow hover:shadow-glow-lg hover:scale-110 active:scale-95' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              {/* Ripple effect */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl scale-0 group-active:scale-100 transition-transform duration-200" />
              
              <PaperAirplaneIcon className={`
                h-6 w-6 transition-all duration-300 relative z-10
                ${message.trim() ? 'group-hover:translate-x-1 group-hover:-translate-y-1' : ''}
              `} />
            </button>
          </div>

          {/* Enhanced Quick Commands Panel */}
          {message === '/' && (
            <div className="absolute bottom-full left-0 right-0 mb-4 animate-scale-in">
              <div className="glass-panel-heavy rounded-2xl p-6 border-2 border-white/40 shadow-large backdrop-blur-2xl">
                <div className="flex items-center mb-4">
                  <CommandLineIcon className="h-5 w-5 text-primary-600 mr-3" />
                  <h3 className="text-sm font-bold text-slate-800">Quick Commands</h3>
                  <div className="ml-auto text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    AI-Powered
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { 
                      cmd: '/estimate', 
                      desc: 'Analyze files for cost estimation',
                      icon: '📊',
                      color: 'emerald'
                    },
                    { 
                      cmd: '/rfi', 
                      desc: 'Draft request for information',
                      icon: '📋',
                      color: 'amber'
                    },
                    { 
                      cmd: '/export', 
                      desc: 'Export current results',
                      icon: '📤',
                      color: 'cyan'
                    },
                    { 
                      cmd: '/validate', 
                      desc: 'Check plan accuracy',
                      icon: '✅',
                      color: 'indigo'
                    },
                  ].map((item) => (
                    <button
                      key={item.cmd}
                      onClick={() => setMessage(item.cmd + ' ')}
                      className={`
                        group w-full text-left p-4 rounded-2xl transition-all duration-300
                        bg-white/60 hover:bg-white/80 border-2 border-transparent
                        hover:border-${item.color}-200 hover:shadow-medium hover:scale-[1.02]
                        backdrop-blur-sm
                      `}
                    >
                      <div className="flex items-center">
                        <div className={`
                          w-10 h-10 rounded-xl bg-${item.color}-100 flex items-center justify-center
                          mr-4 group-hover:scale-110 transition-transform duration-300
                        `}>
                          <span className="text-lg">{item.icon}</span>
                        </div>
                        <div className="flex-grow">
                          <span className={`text-${item.color}-600 font-bold text-sm block`}>
                            {item.cmd}
                          </span>
                          <span className="text-slate-600 text-xs">{item.desc}</span>
                        </div>
                        <div className={`
                          w-2 h-2 bg-${item.color}-400 rounded-full opacity-0 
                          group-hover:opacity-100 transition-opacity duration-300
                        `} />
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="text-xs text-slate-500 text-center">
                    Type any command or describe your task in natural language
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Enhanced Status Bar */}
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-medium" />
              <span className="font-semibold">Connected</span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <CommandLineIcon className="h-3 w-3" />
              <span>Press / for commands</span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>⌘</span>
              <span>+</span>
              <span>↵</span>
              <span>to send</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            {message.length > 0 && (
              <span className="font-medium">
                {message.length} character{message.length !== 1 ? 's' : ''}
              </span>
            )}
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>AI Enhanced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
