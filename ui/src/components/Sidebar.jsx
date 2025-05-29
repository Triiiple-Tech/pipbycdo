import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChatBubbleLeftEllipsisIcon, DocumentDuplicateIcon, TableCellsIcon, ClockIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ activeTab, onTabChange, isCollapsed, onToggleCollapse }) => {
  const tabs = [
    { name: 'Chat', icon: ChatBubbleLeftEllipsisIcon },
    { name: 'Files', icon: DocumentDuplicateIcon },
    { name: 'Smartsheet', icon: TableCellsIcon },
    { name: 'History', icon: ClockIcon },
  ];

  return (
    <div className={`transition-all duration-300 ease-in-out bg-gray-800 text-white flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {!isCollapsed && <span className="text-xl font-semibold">PIP AI</span>}
        <button onClick={onToggleCollapse} className="p-1 hover:bg-gray-700 rounded">
          {isCollapsed ? <ChevronRightIcon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
        </button>
      </div>
      <nav className="flex-grow">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => onTabChange(tab.name)}
            className={`flex items-center w-full px-4 py-3 hover:bg-gray-700 transition-colors duration-150 ease-in-out ${activeTab === tab.name ? 'bg-gray-900 border-l-4 border-blue-500' : ''
              }`}
            title={tab.name}
          >
            <tab.icon className={`h-6 w-6 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
            {!isCollapsed && <span className="text-sm">{tab.name}</span>}
          </button>
        ))}
      </nav>
      {/* Add other sidebar elements like saved queries or settings if needed */}
    </div>
  );
};

export default Sidebar;
