import React, { useState } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChatBubbleLeftEllipsisIcon, 
  DocumentDuplicateIcon, 
  TableCellsIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

const Sidebar = ({ activeTab, onTabChange, isCollapsed, onToggleCollapse }) => {
  const [hoveredTab, setHoveredTab] = useState(null);

  const tabs = [
    { name: 'Chat', icon: ChatBubbleLeftEllipsisIcon, color: 'text-primary-500' },
    { name: 'Files', icon: DocumentDuplicateIcon, color: 'text-emerald-500' },
    { name: 'Smartsheet', icon: TableCellsIcon, color: 'text-cyan-500' },
    { name: 'History', icon: ClockIcon, color: 'text-amber-500' },
  ];

  return (
    <div className={`
      fixed left-4 top-4 bottom-4 z-50
      transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
      glass-panel-heavy floating-panel
      flex flex-col
      ${isCollapsed ? 'w-16' : 'w-72'}
      rounded-3xl border-gradient
      before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/20 before:to-white/5 before:pointer-events-none
      animate-slide-right animate-float
    `}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/20 backdrop-blur-sm">
        {!isCollapsed && (
          <div className="animate-slide-right" style={{animationDelay: '0.1s'}}>
            <h1 className="text-2xl font-bold text-gradient mb-1">
              PIP AI
            </h1>
            <p className="text-xs text-slate-600 font-medium tracking-wide">
              Preconstruction Intelligence Platform
            </p>
          </div>
        )}
        <button 
          onClick={onToggleCollapse} 
          className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 hover:scale-110 hover:rotate-180 group relative overflow-hidden"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Ripple effect */}
          <div className="absolute inset-0 bg-primary-500/20 rounded-2xl scale-0 group-active:scale-100 transition-transform duration-200" />
          
          {isCollapsed ? 
            <ChevronRightIcon className="h-5 w-5 text-slate-700 relative z-10" /> : 
            <ChevronLeftIcon className="h-5 w-5 text-slate-700 relative z-10" />
          }
        </button>
      </div>      {/* Navigation */}
      <nav className="flex-grow p-3 space-y-2 overflow-y-auto">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.name;
          const isHovered = hoveredTab === tab.name;
          
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              onMouseEnter={() => setHoveredTab(tab.name)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`
                flex items-center w-full px-4 py-4 rounded-2xl
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                group relative overflow-hidden backdrop-blur-sm
                ${isActive 
                  ? 'bg-gradient-to-r from-primary-500/30 to-primary-600/20 shadow-glow border-2 border-primary-400/40 scale-105' 
                  : 'hover:bg-white/30 hover:scale-105 hover:shadow-medium border-2 border-transparent'
                }
                ${isHovered ? 'animate-bounce-gentle' : ''}
                animate-slide-up
              `}
              style={{animationDelay: `${index * 0.1}s`}}
              title={tab.name}
            >
              {/* Shimmer effect for active tab */}
              {isActive && (
                <div className="absolute inset-0 shimmer-effect rounded-2xl" />
              )}
              
              {/* Background glow */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/10 rounded-2xl animate-pulse-glow" />
              )}
              
              {/* Icon container */}
              <div className={`
                relative z-10 transition-all duration-300 p-2 rounded-xl
                ${isCollapsed ? 'mx-auto' : 'mr-4'}
                ${isActive 
                  ? `${tab.color} bg-white/20 shadow-medium scale-110` 
                  : 'text-slate-700 group-hover:text-slate-800 group-hover:bg-white/20'
                }
                ${isHovered ? 'animate-wiggle' : ''}
              `}>
                <tab.icon className="h-6 w-6" />
              </div>
              
              {/* Label */}
              {!isCollapsed && (
                <div className="relative z-10 flex-grow text-left">
                  <span className={`
                    text-sm font-semibold transition-all duration-300
                    ${isActive ? 'text-slate-800' : 'text-slate-700 group-hover:text-slate-800'}
                    animate-slide-right
                  `}>
                    {tab.name}
                  </span>
                  {isActive && (
                    <div className="w-full h-0.5 bg-gradient-to-r from-primary-500 to-transparent mt-1 animate-scale-in" />
                  )}
                </div>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute right-3 w-2 h-2 bg-primary-500 rounded-full animate-pulse shadow-glow" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/20 backdrop-blur-sm">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
              <p className="text-xs text-slate-600 font-medium mb-1">System Status</p>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse mr-3 shadow-medium" />
                <div>
                  <span className="text-sm text-slate-700 font-semibold">Connected</span>
                  <p className="text-xs text-slate-500">All systems operational</p>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse shadow-medium" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
