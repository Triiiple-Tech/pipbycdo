import React, { useState } from 'react';

const FileUpload = ({ onUploadSuccess, onUploadError, setIsLoading }) => {
  const [selectedFiles, setSelectedFiles] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      onUploadError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    onUploadError(null); // Clear previous errors

    try {
      // Pass the FileList object directly to the api service
      onUploadSuccess(selectedFiles);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError('File upload failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-300 rounded-lg shadow-sm">
      <div className="mb-4">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
          Choose files (PDF, DOCX)
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".pdf,.docx"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Upload and Analyze
      </button>
    </form>
  );
};

export default FileUpload;
