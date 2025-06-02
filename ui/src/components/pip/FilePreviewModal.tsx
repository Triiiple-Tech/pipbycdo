import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, FileText, Image, File, Grid } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    content?: string;
    status: 'queued' | 'parsing' | 'done' | 'error';
  };
  onDownload?: (file: any) => void;
  className?: string;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
  className
}: FilePreviewModalProps) {
  const getFileIcon = (type: string, name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <Grid className="w-6 h-6 text-green-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <Image className="w-6 h-6 text-purple-500" />;
      default:
        return <File className="w-6 h-6 text-slate-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPreviewContent = () => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // For images, show image preview
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '') && file.url) {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
          <img 
            src={file.url} 
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }

    // For text content
    if (file.content) {
      return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-6 overflow-y-auto">
          <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
            {file.content}
          </pre>
        </div>
      );
    }

    // For PDFs and other documents
    if (['pdf', 'docx', 'xlsx'].includes(extension || '')) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg p-12">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center mb-6">
            {getFileIcon(file.type, file.name)}
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Document Preview
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6 max-w-md">
            Preview for {extension?.toUpperCase()} files is not yet available. You can download the file to view it.
          </p>
          <Button 
            onClick={() => onDownload?.(file)}
            className="bg-cdo-red hover:bg-cdo-red/90 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download to View
          </Button>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg p-12">
        <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center mb-6">
          {getFileIcon(file.type, file.name)}
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Preview Not Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6 max-w-md">
          Preview for this file type is not supported. You can download the file to view it.
        </p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "relative w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type, file.name)}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {onDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(file)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                  
                  {file.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="w-8 h-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6 h-full overflow-hidden">
                {file.status === 'parsing' ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      Processing File...
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      Please wait while we process your file for preview.
                    </p>
                  </div>
                ) : file.status === 'error' ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                      <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      Preview Error
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      We couldn't generate a preview for this file. You can still download it.
                    </p>
                  </div>
                ) : (
                  getPreviewContent()
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
