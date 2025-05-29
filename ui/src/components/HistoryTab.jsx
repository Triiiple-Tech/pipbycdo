import React from 'react';

const HistoryTab = () => {
  // Placeholder content for History
  return (
    <div className="p-4 bg-white h-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat & Task History</h2>
      <input type="search" placeholder="Filter by project, trade, or date..." className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500" />
      <div className="text-gray-500">
        <p>Past chats, estimates, and exports will be listed here.</p>
        <p className="text-sm">This feature is under development.</p>
        {/* Example History Item */}
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <p className="font-medium text-gray-700">Estimate for Project Alpha - Drywall</p>
          <p className="text-xs text-gray-500">May 28, 2025 - Saved by User</p>
          <button className="text-xs text-blue-600 hover:underline mt-1">Load Session</button>
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;
