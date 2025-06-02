import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, File, FileText, Image, Archive, X, Check, AlertTriangle, Loader2, Database, Video, Music, Code } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { FileCard, FileCardData } from "./FileCard";

interface UploadedFile extends FileCardData {
  id: string;
  progress: number;
  status: "queued" | "parsing" | "done" | "error";
  uploadedAt: Date;
  errorMessage?: string;
  isLargeFile?: boolean;
  compressionNeeded?: boolean;
  originalFile?: File; // Store the original File object
}

interface FileUploadProps {
  onFilesUploaded?: (files: File[]) => void;
  onFileReanalyze?: (fileId: string) => void;
  onFileRemove?: (fileId: string) => void;
  onFilePreview?: (file: FileCardData) => void;
  className?: string;
  disabled?: boolean;
  maxFileSize?: number; // in MB, default 75MB
  supportedFormats?: string[]; // e.g., ['.pdf', '.docx', '.xlsx', '.txt']
  showFileCards?: boolean; // Whether to show enhanced file cards
  compressionWarning?: boolean; // Show warning for large files
}

// Supported formats as per UX Master Doc Section II
const DEFAULT_SUPPORTED_FORMATS = ['.pdf', '.docx', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.csv'];
const DEFAULT_MAX_FILE_SIZE = 75; // MB

const getFileIcon = (type: string = "", name: string = "") => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  // Image files
  if (type.startsWith("image/") || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return Image;
  }
  
  // Document files
  if (['pdf', 'doc', 'docx'].includes(ext) || type.includes('pdf') || type.includes('document')) {
    return FileText;
  }
  
  // Spreadsheet files
  if (['xlsx', 'xls', 'csv'].includes(ext) || type.includes('spreadsheet')) {
    return Database;
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || type.includes('zip') || type.includes('archive')) {
    return Archive;
  }
  
  // Video files
  if (type.startsWith("video/") || ['mp4', 'avi', 'mov', 'mkv', 'wmv'].includes(ext)) {
    return Video;
  }
  
  // Audio files
  if (type.startsWith("audio/") || ['mp3', 'wav', 'flac', 'aac'].includes(ext)) {
    return Music;
  }
  
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext)) {
    return Code;
  }
  
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function FileUpload({
  onFilesUploaded,
  onFileReanalyze,
  onFileRemove,
  onFilePreview,
  className,
  disabled,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  supportedFormats = DEFAULT_SUPPORTED_FORMATS,
  showFileCards = true,
  compressionWarning = true,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxFileSize}MB limit. Compression may be required.`
      };
    }

    // Check file format
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedFormats.includes(fileExt)) {
      return {
        valid: false,
        error: `Unsupported file format. Supported: ${supportedFormats.join(', ')}`
      };
    }

    return { valid: true };
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled, maxFileSize, supportedFormats],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
    },
    [maxFileSize, supportedFormats],
  );

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => {
      const validation = validateFile(file);
      const isLargeFile = file.size > (maxFileSize * 1024 * 1024);
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: validation.valid ? "queued" : "error",
        uploadedAt: new Date(),
        errorMessage: validation.error,
        isLargeFile,
        compressionNeeded: isLargeFile && compressionWarning,
        originalFile: file, // Store the original File object
      };
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress for valid files
    newFiles.forEach((file) => {
      if (file.status === "error") return;
      
      let progress = 0;
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "parsing" as const } : f
        )
      );

      const interval = setInterval(() => {
        progress += Math.random() * 20 + 5; // Faster progress simulation
        if (progress >= 100) {
          progress = 100;
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, progress: 100, status: "done" as const }
                : f,
            ),
          );
          clearInterval(interval);
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress } : f)),
          );
        }
      }, 150); // Faster updates
    });

    // Call the callback with valid files
    const validFiles = files.filter((_, index) => newFiles[index].status !== "error");
    if (validFiles.length > 0) {
      onFilesUploaded?.(validFiles);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    onFileRemove?.(id);
  };

  const reanalyzeFile = (id: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === id 
          ? { ...f, status: "parsing" as const, progress: 0, errorMessage: undefined }
          : f
      )
    );
    onFileReanalyze?.(id);
  };

  const handleFileCompression = (updatedFileData: FileCardData) => {
    // Update the file in the uploaded files list with the compressed version
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === updatedFileData.id 
          ? { 
              ...f, 
              ...updatedFileData,
              isLargeFile: (updatedFileData.size || 0) > (maxFileSize * 1024 * 1024),
              compressionNeeded: false // No longer needs compression
            }
          : f
      )
    );

    // Optionally call a parent handler to notify about the compression
    console.log(`File ${updatedFileData.name} compressed successfully`);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Enhanced drag and drop area */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer",
          "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm",
          isDragOver
            ? "border-cdo-red bg-cdo-red/10 shadow-glow-red"
            : "border-slate-300 dark:border-slate-600 hover:border-cdo-red/50 hover:bg-cdo-red/5",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={!disabled ? triggerFileSelect : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          disabled={disabled}
          accept={supportedFormats.join(',')}
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            className={cn(
              "w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300",
              isDragOver
                ? "border-cdo-red text-cdo-red bg-cdo-red/10 shadow-glow-red"
                : "border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400",
            )}
          >
            <Upload className="w-8 h-8" />
          </motion.div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {isDragOver ? "Drop files here" : "Drop files here or click to upload"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {supportedFormats.join(', ').toUpperCase()} up to {maxFileSize}MB each
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Files over {maxFileSize}MB may require compression
            </p>
          </div>

          <Button
            variant="outline"
            className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-cdo-red hover:bg-cdo-red/5 hover:text-cdo-red transition-all duration-200"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              triggerFileSelect();
            }}
          >
            Choose Files
          </Button>
        </div>
      </motion.div>

      {/* Enhanced file list with cards */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Uploaded Files ({uploadedFiles.length})
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUploadedFiles([])}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Clear All
              </Button>
            </div>
            
            {showFileCards ? (
              // Enhanced file cards view
              <div className="grid gap-3">
                {uploadedFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onReanalyze={reanalyzeFile}
                    onRemove={removeFile}
                    onPreview={onFilePreview}
                    onCompress={handleFileCompression}
                    compact={false}
                    showMetadata={false}
                  />
                ))}
              </div>
            ) : (
              // Compact list view
              <div className="space-y-2">
                {uploadedFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type, file.name);
                  const isParsing = file.status === "parsing";
                  const isError = file.status === "error";
                  const isDone = file.status === "done";
                  
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm"
                    >
                      <FileIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {file.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs transition-all duration-200",
                                isParsing && "border-blue-400/50 bg-blue-500/10 text-blue-600",
                                isDone && "border-green-400/50 bg-green-500/10 text-green-600",
                                isError && "border-red-400/50 bg-red-500/10 text-red-600",
                                file.status === "queued" && "border-yellow-400/50 bg-yellow-500/10 text-yellow-600"
                              )}
                            >
                              {isParsing && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              {isError && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {isDone && <Check className="w-3 h-3 mr-1" />}
                              {file.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isParsing && (
                            <Progress value={file.progress} className="flex-1 h-1" />
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatFileSize(file.size)}
                          </span>
                          {file.isLargeFile && (
                            <Badge variant="outline" className="text-xs border-amber-400/50 bg-amber-500/10 text-amber-600">
                              Large
                            </Badge>
                          )}
                        </div>

                        {isError && file.errorMessage && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {file.errorMessage}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
