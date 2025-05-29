import React from 'react';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

const DragDropOverlay = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-primary-900/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-8 border-4 border-dashed border-primary-400 rounded-3xl flex items-center justify-center animate-scale-in">
        <div className="text-center animate-bounce-gentle">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-glow-lg">
            <CloudArrowUpIcon className="h-12 w-12 text-white" />
          </div>
          
          <h3 className="text-3xl font-bold text-primary-700 mb-2">
            Drop Files Here
          </h3>
          
          <p className="text-lg text-primary-600 mb-6 max-w-md mx-auto">
            Release to upload your construction documents, plans, and specifications
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-primary-500">
            <div className="flex items-center space-x-2">
              <DocumentIcon className="h-5 w-5" />
              <span>PDF</span>
            </div>
            <div className="flex items-center space-x-2">
              <DocumentIcon className="h-5 w-5" />
              <span>DOCX</span>
            </div>
            <div className="flex items-center space-x-2">
              <DocumentIcon className="h-5 w-5" />
              <span>XLSX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragDropOverlay;
