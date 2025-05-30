import React, { useState, useMemo } from 'react';
import {
  DocumentTextIcon,
  TableCellsIcon,
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PrinterIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid'; // For empty state

// Helper function (ideal to move to a utils file)
const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function (ideal to move to a utils file)
// Basic version, for more complex relative time, use a library like date-fns
const formatRelativeTime = dateString => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} days ago`;
};

const FilesTab = ({
  files: initialFiles = [],
  onUpload,
  onDeleteFile,
  onDownloadFile,
  onReprocessFile,
  onPrintFile,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('uploadDate'); // name, size, status, uploadDate
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [activePreviewTab, setActivePreviewTab] = useState('preview'); // preview, details

  const getFileIcon = (fileName, className = 'h-6 w-6') => {
    const extension = fileName ? fileName.split('.').pop().toLowerCase() : '';
    switch (extension) {
      case 'pdf':
        return <DocumentTextIcon className={`${className} text-red-500`} />;
      case 'docx':
      case 'doc':
        return <DocumentTextIcon className={`${className} text-blue-500`} />;
      case 'xlsx':
      case 'xls':
        return <TableCellsIcon className={`${className} text-green-500`} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <PhotoIcon className={`${className} text-purple-500`} />;
      default:
        return <DocumentTextIcon className={`${className} text-gray-500`} />;
    }
  };

  const getStatusInfo = status => {
    switch (status) {
      case 'Ready':
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          text: 'Ready',
        };
      case 'Parsing':
      case 'Processing':
      case 'Uploading...':
        return {
          icon: <ClockIcon className="h-5 w-5 text-amber-500 animate-pulse" />,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          text: status,
        };
      case 'Error':
        return {
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
          color: 'text-red-700 bg-red-50 border-red-200',
          text: 'Error',
        };
      default:
        return {
          icon: <ClockIcon className="h-5 w-5 text-gray-400" />,
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          text: status || 'Pending',
        };
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    let processedFiles = initialFiles.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    processedFiles.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'size') {
        // Assuming size is a string like "1.2 MB", parse it to bytes for sorting
        // This is a simplified parser, a more robust one would be needed for production
        const parseSize = sizeStr => {
          if (!sizeStr) return 0;
          const parts = sizeStr.toLowerCase().split(' ');
          let multiplier = 1;
          if (parts[1] === 'kb') multiplier = 1024;
          if (parts[1] === 'mb') multiplier = 1024 * 1024;
          if (parts[1] === 'gb') multiplier = 1024 * 1024 * 1024;
          return parseFloat(parts[0]) * multiplier;
        };
        valA = parseSize(a.size);
        valB = parseSize(b.size);
      } else if (sortBy === 'uploadDate' || sortBy === 'lastModified') {
        valA = new Date(a[sortBy] || 0);
        valB = new Date(b[sortBy] || 0);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return processedFiles;
  }, [initialFiles, searchTerm, sortBy, sortOrder]);

  const handleSort = field => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIndicator = ({ field }) => {
    if (sortBy !== field)
      return <ChevronUpDownIcon className="h-4 w-4 text-gray-400 ml-1" />;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-gray-600 ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-gray-600 ml-1" />
    );
  };

  if (!initialFiles || (initialFiles.length === 0 && !searchTerm)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 rounded-lg">
        <DocumentMagnifyingGlassIcon className="h-24 w-24 text-pip-red/20 mb-6" />
        <h3 className="text-2xl font-semibold text-slate-700 mb-3">
          No Files Uploaded Yet
        </h3>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          Drag and drop your documents here, or click the button below to select
          files for analysis.
        </p>
        {onUpload && (
          <button
            onClick={onUpload}
            className="button-primary inline-flex items-center"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Upload New File
          </button>
        )}
        <p className="text-sm text-slate-400 mt-6">
          Supported file types: PDF, DOCX
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-100 p-4 sm:p-6 space-x-4 sm:space-x-6">
      {/* Left Panel: File List & Controls */}
      <div className="flex-shrink-0 w-full md:w-2/5 lg:w-1/3 xl:w-1/4 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Files</h2>
            {onUpload && (
              <button
                onClick={onUpload}
                title="Upload New File"
                className="p-2 rounded-lg hover:bg-pip-red/10 text-pip-red transition-colors"
              >
                <ArrowUpTrayIcon className="h-6 w-6" />
              </button>
            )}
          </div>
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-pip-red focus:border-pip-red transition-shadow shadow-sm"
            />
          </div>
        </div>

        {/* Sort Controls - Simplified for now */}
        <div className="p-2 border-b border-slate-200 flex items-center justify-start space-x-2 text-sm">
          <span className="text-slate-600 font-medium">Sort by:</span>
          {['name', 'uploadDate', 'size', 'status'].map(field => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`px-2 py-1 rounded-md flex items-center transition-colors ${sortBy === field ? 'bg-pip-red/10 text-pip-red font-semibold' : 'hover:bg-slate-200 text-slate-500'}`}
            >
              {field.charAt(0).toUpperCase() +
                field.slice(1).replace('uploadDate', 'Date')}
              <SortIndicator field={field} />
            </button>
          ))}
        </div>

        {/* File List */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {filteredAndSortedFiles.length === 0 && (
            <div className="text-center py-10 px-4">
              <MagnifyingGlassIcon className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">
                No files match your search.
              </p>
              <p className="text-sm text-slate-400">
                Try a different term or clear the search.
              </p>
            </div>
          )}
          {filteredAndSortedFiles.map(file => {
            const statusInfo = getStatusInfo(file.status);
            return (
              <div
                key={file.id || file.name} // Prefer a unique ID
                onClick={() => {
                  setSelectedFile(file);
                  setActivePreviewTab('preview');
                }}
                className={`p-3 flex items-center space-x-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out
                            ${selectedFile && (selectedFile.id || selectedFile.name) === (file.id || file.name) ? 'bg-pip-red/10 ring-2 ring-pip-red/50' : 'hover:bg-slate-100'}`}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.name, 'h-8 w-8')}
                </div>
                <div className="flex-grow min-w-0">
                  <h4
                    className="text-sm font-semibold text-slate-800 truncate"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {file.size ? formatFileSize(file.size) : 'Size N/A'}
                    {file.uploadDate && <span className="mx-1">•</span>}
                    {file.uploadDate ? formatRelativeTime(file.uploadDate) : ''}
                  </p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end text-xs">
                  <div className="flex items-center" title={statusInfo.text}>
                    {statusInfo.icon}
                    <span
                      className={`ml-1 font-medium ${statusInfo.color.split(' ')[0]}`}
                    >
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="mt-1 flex space-x-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDownloadFile && onDownloadFile(file.id || file.name);
                      }}
                      title="Download"
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 text-slate-500 hover:text-emerald-600" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteFile && onDeleteFile(file.id || file.name);
                      }}
                      title="Delete"
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <TrashIcon className="h-4 w-4 text-slate-500 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* TODO: Load More Button if pagination is implemented */}
      </div>

      {/* Right Panel: File Preview/Details */}
      <div className="flex-grow flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
        {!selectedFile ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
            <EyeIcon className="h-20 w-20 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Select a file to view details
            </h3>
            <p className="text-slate-400 max-w-xs">
              Click on a file from the list on the left to see its preview and
              detailed information here.
            </p>
          </div>
        ) : (
          <>
            {/* Header for selected file */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                {getFileIcon(selectedFile.name, 'h-8 w-8')}
                <h3
                  className="text-lg font-semibold text-slate-800 truncate"
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                title="Close preview"
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-4 border-b border-slate-200">
              <nav className="flex space-x-2">
                {['preview', 'details'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivePreviewTab(tab)}
                    className={`py-3 px-1 text-sm font-medium transition-colors
                                ${
                                  activePreviewTab === tab
                                    ? 'border-b-2 border-pip-red text-pip-red'
                                    : 'text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300'
                                }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6">
              {activePreviewTab === 'preview' && (
                <div>
                  {/* Basic Preview - enhance later (e.g. iframe for PDF) */}
                  <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                    {selectedFile.type &&
                    selectedFile.type.startsWith('image/') &&
                    selectedFile.previewUrl ? (
                      <img
                        src={selectedFile.previewUrl}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-slate-500">
                        {getFileIcon(
                          selectedFile.name,
                          'h-16 w-16 text-slate-400'
                        )}
                        <p className="mt-2">
                          Preview not available for this file type.
                        </p>
                        <p className="text-xs">
                          ({selectedFile.type || 'Unknown type'})
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        onDownloadFile &&
                        onDownloadFile(selectedFile.id || selectedFile.name)
                      }
                      className="button-secondary inline-flex items-center"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Download
                    </button>
                    <button
                      onClick={() =>
                        onPrintFile &&
                        onPrintFile(selectedFile.id || selectedFile.name)
                      }
                      className="button-outline inline-flex items-center"
                    >
                      <PrinterIcon className="h-5 w-5 mr-2" /> Print
                    </button>
                  </div>
                </div>
              )}

              {activePreviewTab === 'details' && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-slate-700 mb-1">
                    File Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {[
                      { label: 'File Name', value: selectedFile.name },
                      { label: 'Type', value: selectedFile.type || 'N/A' },
                      {
                        label: 'Size',
                        value: selectedFile.size
                          ? formatFileSize(selectedFile.size)
                          : 'N/A',
                      },
                      {
                        label: 'Status',
                        value: (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusInfo(selectedFile.status).color.replace('text-', 'bg-').replace('-700', '-100').replace('-600', '-100').replace('-800', '-100')} ${getStatusInfo(selectedFile.status).color.split(' ')[0]}`}
                          >
                            {getStatusInfo(selectedFile.status).text}
                          </span>
                        ),
                      },
                      {
                        label: 'Upload Date',
                        value: selectedFile.uploadDate
                          ? new Date(selectedFile.uploadDate).toLocaleString()
                          : 'N/A',
                      },
                      {
                        label: 'Last Modified',
                        value: selectedFile.lastModified
                          ? new Date(selectedFile.lastModified).toLocaleString()
                          : 'N/A',
                      },
                    ].map(item => (
                      <div key={item.label}>
                        <dt className="font-medium text-slate-500">
                          {item.label}
                        </dt>
                        <dd
                          className="text-slate-700 mt-0.5 truncate"
                          title={
                            typeof item.value === 'string' ? item.value : ''
                          }
                        >
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </div>

                  {selectedFile.status === 'Error' && selectedFile.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-red-700">
                            Error Details
                          </h5>
                          <p className="text-sm text-red-600">
                            {selectedFile.error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 flex space-x-3">
                    {selectedFile.status === 'Error' && onReprocessFile && (
                      <button
                        onClick={() =>
                          onReprocessFile(selectedFile.id || selectedFile.name)
                        }
                        className="button-primary inline-flex items-center"
                      >
                        <ArrowPathIcon className="h-5 w-5 mr-2" /> Reprocess
                        File
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDeleteFile &&
                          onDeleteFile(selectedFile.id || selectedFile.name);
                        setSelectedFile(null);
                      }}
                      className="button-danger-outline inline-flex items-center"
                    >
                      <TrashIcon className="h-5 w-5 mr-2" /> Delete File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilesTab;
