import React from 'react';

const StatusDisplay = ({ healthStatus, taskStatus, error }) => {
  return (
    <div className="mb-6 p-4 border border-gray-300 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-2 text-gray-700">System Status</h2>
      <div className="mb-2">
        <span className="font-medium">API Health: </span>
        {healthStatus === 'loading' && <span className="text-gray-500">Checking...</span>}
        {healthStatus === 'ok' && <span className="text-green-600 font-semibold">OK</span>}
        {healthStatus === 'error' && <span className="text-red-600 font-semibold">Error</span>}
      </div>
      {taskStatus && (
        <div className="mb-2">
          <span className="font-medium">Analysis Task: </span>
          <span
            className={`font-semibold ${taskStatus.status === 'pending' ? 'text-yellow-600' : taskStatus.status === 'completed' ? 'text-green-600' : taskStatus.status === 'failed' ? 'text-red-600' : 'text-gray-500'
              }`}
          >
            {taskStatus.status.toUpperCase()}
          </span>
          {taskStatus.status === 'failed' && taskStatus.error && (
            <p className="text-sm text-red-500 mt-1">Error: {taskStatus.error}</p>
          )}
        </div>
      )}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;
