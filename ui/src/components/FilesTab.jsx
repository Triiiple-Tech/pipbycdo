import React from 'react';

const FilesTab = ({ files }) => {
  if (!files || files.length === 0) {
    return <div className="p-4 text-gray-500">No files uploaded yet. Drag and drop files into the chat or use the '+' button.</div>;
  }

  return (
    <div className="p-4 space-y-3 h-full overflow-y-auto bg-white">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">Uploaded Files</h2>
      {files.map((file, index) => (
        <div key={index} className="p-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 truncate" title={file.name}>{file.name}</span>
            {/* Placeholder for file actions like remove/replace */}
            <button className="text-xs text-red-500 hover:text-red-700">Remove</button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: <span className={`font-semibold ${file.status === 'Ready' ? 'text-green-600' : file.status === 'Parsing' ? 'text-yellow-600' : 'text-red-600'}`}>{file.status || 'Pending'}</span>
          </div>
          {/* Add thumbnail/preview logic here */}
          {file.error && <p className="text-xs text-red-500 mt-1">Error: {file.error}</p>}
        </div>
      ))}
    </div>
  );
};

export default FilesTab;
