import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Upload, FileText, Image, File, X } from 'lucide-react';
import { useState } from 'react';

interface FileUploadOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onFilesDrop: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
}

export function FileUploadOverlay({
  isVisible,
  onClose,
  onFilesDrop,
  acceptedTypes = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'],
  maxFileSize = 10,
  className
}: FileUploadOverlayProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    
    // Validate files
    const invalidFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = acceptedTypes.includes(extension);
      const isValidSize = file.size <= (maxFileSize * 1024 * 1024);
      return !isValidType || !isValidSize;
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid files detected. Please ensure files are ${acceptedTypes.join(', ')} and under ${maxFileSize}MB.`);
      return;
    }

    onFilesDrop(files);
    onClose();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image className="w-8 h-8 text-green-500" />;
      default:
        return <File className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
            className
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Enhanced Main upload area with CDO Red and glassmorphic design */}
            <motion.div
              animate={{
                scale: isDragOver ? 1.02 : 1,
                borderColor: isDragOver ? '#E60023' : 'rgba(230, 0, 35, 0.3)'
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative rounded-3xl border-4 border-dashed backdrop-blur-xl p-12 text-center shadow-2xl",
                "bg-white/75 dark:bg-slate-800/75", // Enhanced glassmorphic background
                isDragOver 
                  ? "border-cdo-red bg-cdo-red/10 shadow-glow-red" 
                  : "border-cdo-red/30 hover:border-cdo-red/50"
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Enhanced Upload icon with CDO Red branding */}
              <motion.div
                animate={{
                  y: isDragOver ? -5 : 0,
                  scale: isDragOver ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
                className="mx-auto mb-6"
              >
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300",
                  isDragOver 
                    ? "bg-cdo-red/20 shadow-glow-red" 
                    : "bg-slate-100 dark:bg-slate-700 hover:bg-cdo-red/10"
                )}>
                  <Upload className={cn(
                    "w-10 h-10 transition-colors duration-300",
                    isDragOver ? "text-cdo-red" : "text-slate-600 dark:text-slate-400"
                  )} />
                </div>
              </motion.div>

              {/* Text content */}
              <div className="space-y-4">
                <motion.h3
                  animate={{ color: isDragOver ? '#E60023' : '#1e293b' }}
                  className="text-2xl font-bold"
                >
                  {isDragOver ? 'Drop files here!' : 'Upload Files'}
                </motion.h3>
                
                <p className="text-slate-600 text-lg leading-relaxed">
                  Drag and drop your files here, or{' '}
                  <button className="text-red-600 hover:text-red-700 font-semibold underline">
                    browse files
                  </button>
                </p>

                {/* Supported formats */}
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {acceptedTypes.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                    >
                      {type.toUpperCase()}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-slate-500 mt-4">
                  Maximum file size: {maxFileSize}MB
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visual enhancement - floating elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <motion.div
                  animate={{
                    x: [0, 10, 0],
                    y: [0, -5, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="absolute top-8 left-8 opacity-10"
                >
                  <FileText className="w-8 h-8 text-blue-500" />
                </motion.div>
                
                <motion.div
                  animate={{
                    x: [0, -8, 0],
                    y: [0, 8, 0],
                    rotate: [0, -3, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
                  className="absolute top-12 right-12 opacity-10"
                >
                  <Image className="w-6 h-6 text-green-500" />
                </motion.div>
                
                <motion.div
                  animate={{
                    x: [0, 12, 0],
                    y: [0, -8, 0],
                    rotate: [0, 4, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
                  className="absolute bottom-8 left-12 opacity-10"
                >
                  <File className="w-7 h-7 text-purple-500" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
