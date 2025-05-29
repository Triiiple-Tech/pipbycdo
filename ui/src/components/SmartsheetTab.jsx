import React from 'react';

const SmartsheetTab = () => {
  // Placeholder content for Smartsheet integration
  return (
    <div className="p-4 bg-white h-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Smartsheet Integration</h2>
      <div className="mb-4">
        <label htmlFor="smartsheet-url" className="block text-sm font-medium text-gray-700 mb-1">Smartsheet URL or ID</label>
        <input type="text" id="smartsheet-url" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Enter Smartsheet link or ID" />
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Load Sheet
      </button>
      <div className="mt-6 text-gray-500">
        <p>Sheet preview and attachment analysis will appear here.</p>
        <p className="text-sm">This feature is under development.</p>
      </div>
    </div>
  );
};

export default SmartsheetTab;
