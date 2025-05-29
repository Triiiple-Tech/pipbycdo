import React from 'react';
import { 
  UserIcon, 
  CpuChipIcon, 
  DocumentTextIcon, 
  CalculatorIcon, 
  ArrowPathIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/solid';

const MessageBubble = ({ message }) => {
  const { text, sender, agent, timestamp, file, isUser, agentType } = message;

  const agentConfig = {
    Estimator: { 
      color: 'emerald-500', 
      bgClass: 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 border-emerald-200/60', 
      textClass: 'text-emerald-900',
      icon: CalculatorIcon,
      badge: 'bg-emerald-100/80 text-emerald-800 ring-emerald-200',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
    },
    Manager: { 
      color: 'purple-500', 
      bgClass: 'bg-gradient-to-br from-purple-50/80 to-purple-100/60 border-purple-200/60', 
      textClass: 'text-purple-900',
      icon: CpuChipIcon,
      badge: 'bg-purple-100/80 text-purple-800 ring-purple-200',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]'
    },
    RFI: { 
      color: 'amber-500', 
      bgClass: 'bg-gradient-to-br from-amber-50/80 to-amber-100/60 border-amber-200/60', 
      textClass: 'text-amber-900',
      icon: DocumentTextIcon,
      badge: 'bg-amber-100/80 text-amber-800 ring-amber-200',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
    },
    Exporter: { 
      color: 'cyan-500', 
      bgClass: 'bg-gradient-to-br from-cyan-50/80 to-cyan-100/60 border-cyan-200/60', 
      textClass: 'text-cyan-900',
      icon: ArrowPathIcon,
      badge: 'bg-cyan-100/80 text-cyan-800 ring-cyan-200',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]'
    },
    Validator: { 
      color: 'indigo-500', 
      bgClass: 'bg-gradient-to-br from-indigo-50/80 to-indigo-100/60 border-indigo-200/60', 
      textClass: 'text-indigo-900',
      icon: ShieldCheckIcon,
      badge: 'bg-indigo-100/80 text-indigo-800 ring-indigo-200',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]'
    },
    default: { 
      color: 'gray-500', 
      bgClass: 'bg-gradient-to-br from-gray-50/80 to-gray-100/60 border-gray-200/60', 
      textClass: 'text-gray-900',
      icon: CpuChipIcon,
      badge: 'bg-gray-100/80 text-gray-700 ring-gray-200',
      glow: 'shadow-soft'
    }
  };

  const config = agentConfig[agentType] || agentConfig.default;
  const AgentIcon = config.icon;

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl group">
          <div className="message-bubble-user rounded-3xl rounded-br-lg shadow-glow-lg hover:shadow-[0_0_30px_rgba(145,71,255,0.5)] transition-all duration-300 p-5 backdrop-blur-xl border border-primary-400/30">
            {/* Message content */}
            <div className="relative z-10">
              <p className="text-base font-medium leading-relaxed whitespace-pre-wrap text-white/95">
                {text}
              </p>
              
              {file && (
                <div className="mt-4 p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-white/90 mr-3" />
                    <div>
                      <p className="text-sm font-semibold text-white/95">{file.name}</p>
                      <p className="text-xs text-white/70">Attachment • Click to preview</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer-effect rounded-3xl rounded-br-lg opacity-30" />
          </div>
          
          {/* Timestamp */}
          {timestamp && (
            <p className="text-xs text-slate-500 mt-3 text-right opacity-0 group-hover:opacity-100 transition-all duration-300 font-medium">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl group">
        <div className={`
          message-bubble-agent ${config.bgClass} ${config.glow}
          border-2 p-5 rounded-3xl rounded-bl-lg 
          transition-all duration-300 backdrop-blur-xl
          hover:scale-[1.02] hover:-translate-y-1
          relative overflow-hidden
        `}>
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl rounded-bl-lg" />
          <div className="absolute inset-0 shimmer-effect rounded-3xl rounded-bl-lg opacity-20" />
          
          {/* Agent Header */}
          {agent && (
            <div className="flex items-center mb-4 pb-3 border-b border-current/20 relative z-10">
              <div className={`
                w-10 h-10 rounded-2xl bg-gradient-to-br from-${config.color} to-${config.color}/80 
                flex items-center justify-center mr-4 shadow-medium animate-float
                ring-2 ring-white/30
              `}>
                <AgentIcon className="h-5 w-5 text-white" />
              </div>
              
              <div className="flex-grow">
                <div className={`
                  status-badge ${config.badge} font-bold text-xs tracking-wide
                  shadow-soft backdrop-blur-sm
                `}>
                  {agent} Agent
                </div>
                <p className="text-xs text-current/70 mt-1 font-medium">
                  Processing your request
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 bg-${config.color} rounded-full animate-pulse shadow-medium`} />
                <span className="text-xs text-current/80 font-semibold">Active</span>
              </div>
            </div>
          )}
          
          {/* Message Content */}
          <div className={`${config.textClass} relative z-10`}>
            <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">
              {text}
            </p>
            
            {file && (
              <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-current/20 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-6 w-6 text-current/80 mr-3" />
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-current/90">{file.name}</p>
                    <p className="text-xs text-current/70 font-medium">
                      File processed • Ready for analysis
                    </p>
                  </div>
                  <div className={`w-3 h-3 bg-${config.color} rounded-full animate-pulse`} />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Timestamp */}
        {timestamp && (
          <p className="text-xs text-slate-500 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 font-medium">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
