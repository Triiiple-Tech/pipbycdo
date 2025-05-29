import React from 'react';

const ResultViewer = ({ data }) => {
  if (!data) {
    return null;
  }

  const renderJson = (jsonData) => {
    try {
      return JSON.stringify(jsonData, null, 2);
    } catch (e) {
      console.error("Error stringifying JSON:", e);
      return "Error displaying JSON data.";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(renderJson(data))
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  const handleDownload = () => {
    const jsonString = renderJson(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis_result.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 p-4 border border-gray-300 rounded-lg shadow-sm bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-700">Analysis Result</h2>
        <div>
          <button
            onClick={handleCopy}
            className="mr-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            Copy JSON
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            Download JSON
          </button>
        </div>
      </div>
      <pre className="p-3 bg-white rounded-md shadow-inner overflow-auto text-sm">
        {renderJson(data)}
      </pre>
    </div>
  );
};

export default ResultViewer;
