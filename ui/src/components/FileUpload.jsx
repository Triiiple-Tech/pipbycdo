import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import Button from './Button';

function FileUpload({ onFilesSelected }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleChange = e => {
    e.preventDefault();
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = newFiles => {
    // Filter for PDF and DOCX files only
    const validFiles = newFiles.filter(
      file =>
        file.type === 'application/pdf' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    setFiles(prev => [...prev, ...validFiles]);
    if (onFilesSelected) {
      onFilesSelected(validFiles);
    }
  };

  const removeFile = index => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-cdo-red bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Upload Construction Documents
            </h3>
            <p className="text-gray-700 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-600">
              Supported formats: PDF, DOCX (Max 10MB each)
            </p>
          </div>

          <Button variant="outline" size="lg" onClick={openFileDialog}>
            <Upload className="w-5 h-5 mr-2" />
            Browse Files
          </Button>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-black mb-4">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-black">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:ring-cdo-red"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <Button variant="primary" size="lg">
              <Upload className="w-5 h-5 mr-2" />
              Upload {files.length} File{files.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="outline" onClick={() => setFiles([])}>
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
