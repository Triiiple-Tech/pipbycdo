import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  TableCellsIcon, 
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const FilesTab = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <TableCellsIcon className="h-8 w-8 text-green-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <PhotoIcon className="h-8 w-8 text-purple-500" />;
      default:
        return <DocumentTextIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Ready':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case 'Parsing':
      case 'Uploading...':
        return <ClockIcon className="h-5 w-5 text-amber-500 animate-pulse" />;
      case 'Error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Parsing':
      case 'Uploading...':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
            <DocumentTextIcon className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-3">No Files Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
            Upload your construction documents, plans, and specifications to get started with AI analysis.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-slate-400">
            <span>PDF</span>
            <span>•</span>
            <span>DOCX</span>
            <span>•</span>
            <span>XLSX</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 animate-slide-down">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Document Library</h2>
        <p className="text-slate-600">
          {files.length} file{files.length !== 1 ? 's' : ''} uploaded
        </p>
      </div>

      {/* Files Grid */}
      <div className="flex-grow overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file, index) => (
            <div 
              key={index}
              className="group glass-panel-heavy floating-panel-subtle rounded-2xl p-6 border-2 border-white/40 hover:border-primary-200 transition-all duration-300 animate-slide-up cursor-pointer"
              style={{animationDelay: `${index * 0.1}s`}}
              onClick={() => setSelectedFile(file)}
            >
              {/* File Icon & Name */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 p-3 bg-white/60 rounded-2xl shadow-soft group-hover:scale-110 transition-transform duration-300">
                  {getFileIcon(file.name)}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate group-hover:text-primary-600 transition-colors duration-200" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {file.type || 'Document'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2 mb-4">
                {getStatusIcon(file.status)}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(file.status)}`}>
                  {file.status || 'Pending'}
                </span>
              </div>

              {/* Error Message */}
              {file.error && (
                <div className="mb-4 p-3 bg-red-50/80 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 font-medium">{file.error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/30">
                <div className="flex items-center space-x-2">
                  <button 
                    className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200 hover:scale-110 group/btn"
                    title="Preview file"
                  >
                    <EyeIcon className="h-4 w-4 text-slate-600 group-hover/btn:text-primary-600" />
                  </button>
                  <button 
                    className="p-2 hover:bg-white/60 rounded-xl transition-all duration-200 hover:scale-110 group/btn"
                    title="Download file"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 text-slate-600 group-hover/btn:text-emerald-600" />
                  </button>
                </div>
                
                <button 
                  className="p-2 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110 group/btn"
                  title="Remove file"
                >
                  <TrashIcon className="h-4 w-4 text-slate-400 group-hover/btn:text-red-600" />
                </button>
              </div>

              {/* Processing indicator */}
              {(file.status === 'Parsing' || file.status === 'Uploading...') && (
                <div className="mt-4 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-shimmer" style={{width: '60%'}} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-white/30 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="button-primary">
              Process All Files
            </button>
            <button className="button-secondary">
              Bulk Export
            </button>
          </div>
          
          <div className="text-sm text-slate-500">
            {files.filter(f => f.status === 'Ready').length} ready for analysis
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesTab;
