import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  File, 
  FileText, 
  Image, 
  Archive, 
  Database,
  Video,
  Music,
  Code,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Download,
  Eye,
  MoreHorizontal,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from "date-fns";
import { MessageAttachment } from "./MessageBubble";
import { FilePreviewModal } from "./FilePreviewModal";
import { FileCompressionModal } from "./FileCompressionModal";
import { useState } from "react";

export interface FileCardData extends Omit<MessageAttachment, 'id'> {
  id: string; // Make id required
  url?: string; // For file download/access
  content?: string; // For text content display
  uploadedAt?: Date;
  progress?: number;
  preview?: string; // For image previews
  errorMessage?: string;
  processingAgent?: string;
  estimatedTokens?: number;
  compressionWarning?: boolean; // For files >75MB
  originalFile?: File; // Store original File object for compression
}

interface FileCardProps {
  file: FileCardData;
  onReanalyze?: (fileId: string) => void;
  onRemove?: (fileId: string) => void;
  onPreview?: (file: FileCardData) => void;
  onDownload?: (file: FileCardData) => void;
  onCompress?: (file: FileCardData) => void;
  showMetadata?: boolean;
  className?: string;
  compact?: boolean; // For use in message bubbles vs standalone
}

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

const formatFileSize = (bytes: number = 0) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getStatusColor = (status: string = "queued") => {
  switch (status) {
    case "parsing":
      return "border-blue-400/50 bg-blue-500/10 text-blue-600";
    case "done":
      return "border-green-400/50 bg-green-500/10 text-green-600";
    case "error":
      return "border-red-400/50 bg-red-500/10 text-red-600";
    default:
      return "border-yellow-400/50 bg-yellow-500/10 text-yellow-600";
  }
};

const getStatusIcon = (status: string = "queued") => {
  switch (status) {
    case "parsing":
      return Loader2;
    case "done":
      return CheckCircle;
    case "error":
      return AlertTriangle;
    default:
      return Clock;
  }
};

export function FileCard({
  file,
  onReanalyze,
  onRemove,
  onPreview,
  onDownload,
  onCompress,
  showMetadata = false,
  className,
  compact = false,
}: FileCardProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCompressionModal, setShowCompressionModal] = useState(false);
  
  const FileIcon = getFileIcon(file.type, file.name);
  const StatusIcon = getStatusIcon(file.status);
  const isParsing = file.status === "parsing";
  const isError = file.status === "error";
  const isDone = file.status === "done";
  const fileId = file.id;

  // Check if file is large (>75MB)
  const isLargeFile = (file.size || 0) > 75 * 1024 * 1024;

  // Adapter function to convert FileCardData to modal format
  const getModalFile = () => ({
    id: fileId,
    name: file.name,
    type: file.type || '',
    size: file.size || 0,
    url: file.url,
    content: file.content,
    status: file.status || 'queued' as const,
    originalFile: file.originalFile // Pass the original File object
  });

  const handlePreview = () => {
    if (onPreview) {
      onPreview(file);
    } else {
      setShowPreviewModal(true);
    }
  };

  const handleCompress = () => {
    if (onCompress) {
      onCompress(file);
    } else {
      setShowCompressionModal(true);
    }
  };

  const handleCompression = async (compressedFile: File, compressionInfo: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    quality: string;
  }) => {
    // Handle the compressed file result
    setShowCompressionModal(false);
    
    console.log(`File compressed: ${file.name}`, {
      originalSize: compressionInfo.originalSize,
      compressedSize: compressionInfo.compressedSize,
      compressionRatio: compressionInfo.compressionRatio,
      quality: compressionInfo.quality
    });
    
    // You could update the file data here or pass it to a parent handler
    // For example, replace the original file with the compressed version
    if (onCompress) {
      // Create an updated file data object with the compressed file
      const updatedFileData: FileCardData = {
        ...file,
        size: compressedFile.size,
        originalFile: compressedFile,
        name: compressedFile.name
      };
      onCompress(updatedFileData);
    }
  };

  if (compact) {
    // Compact version for message bubbles
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300",
            getStatusColor(file.status),
            "backdrop-blur-sm hover:scale-105 cursor-pointer",
            className
          )}
          onClick={handlePreview}
        >
          <FileIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate max-w-[200px]">
            {file.name}
          </span>
          {isParsing && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {isError && (
            <AlertTriangle className="w-3 h-3" />
          )}
          {isDone && (
            <CheckCircle className="w-3 h-3" />
          )}
        </motion.div>

        {/* Preview Modal */}
        <FilePreviewModal
          file={getModalFile()}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
        />

        {/* Compression Modal */}
        <FileCompressionModal
          file={getModalFile()}
          isOpen={showCompressionModal}
          onClose={() => setShowCompressionModal(false)}
          onCompress={handleCompression}
        />
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-cdo-red/30",
        isError && "border-red-300/50 bg-red-50/80 dark:bg-red-900/20",
        className
      )}
    >
      {/* Large file warning banner */}
      {isLargeFile && (
        <div className="mb-3 p-3 bg-amber-100/80 dark:bg-amber-900/20 border border-amber-300/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700 dark:text-amber-300">
                Large file ({formatFileSize(file.size)}) - may require compression
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCompress}
              className="h-6 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-200 dark:border-amber-600 dark:text-amber-300"
            >
              <Package className="w-3 h-3 mr-1" />
              Compress
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* File icon and preview */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            {file.preview && file.type?.startsWith('image/') ? (
              <img 
                src={file.preview} 
                alt={file.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <FileIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            )}
          </div>
          
          {/* Status indicator */}
          <div className={cn(
            "absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center",
            getStatusColor(file.status)
          )}>
            <StatusIcon className={cn("w-3 h-3", isParsing && "animate-spin")} />
          </div>
        </div>

        {/* File information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
              {file.name}
            </h4>
            
            {/* File type badge */}
            <Badge variant="outline" className="text-xs shrink-0">
              {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
            </Badge>
          </div>

          {/* File metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-2">
            <span>{formatFileSize(file.size)}</span>
            {file.uploadedAt && (
              <>
                <span>•</span>
                <span>{formatDistanceToNow(file.uploadedAt, { addSuffix: true })}</span>
              </>
            )}
            {file.estimatedTokens && (
              <>
                <span>•</span>
                <span>~{file.estimatedTokens} tokens</span>
              </>
            )}
          </div>

          {/* Processing status */}
          {isParsing && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
                <span>Processing with {file.processingAgent || 'File Reader'} Agent</span>
                <span>{file.progress || 0}%</span>
              </div>
              <Progress 
                value={file.progress || 0} 
                className="h-1 bg-blue-100 dark:bg-blue-900"
              />
            </div>
          )}

          {/* Error message */}
          {isError && file.errorMessage && (
            <div className="mb-2 p-2 bg-red-100/80 dark:bg-red-900/20 border border-red-200/50 rounded-md">
              <p className="text-xs text-red-700 dark:text-red-300">
                {file.errorMessage}
              </p>
            </div>
          )}

          {/* Enhanced metadata section */}
          <AnimatePresence>
            {showMetadata && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {file.type && (
                    <div>
                      <span className="font-medium">Type:</span> {file.type}
                    </div>
                  )}
                  {file.uploadedAt && (
                    <div>
                      <span className="font-medium">Uploaded:</span> {file.uploadedAt.toLocaleDateString()}
                    </div>
                  )}
                  {file.estimatedTokens && (
                    <div>
                      <span className="font-medium">Est. Tokens:</span> {file.estimatedTokens}
                    </div>
                  )}
                  {file.processingAgent && (
                    <div>
                      <span className="font-medium">Agent:</span> {file.processingAgent}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={handlePreview}
            title="Preview file"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          {onDownload && isDone && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => onDownload(file)}
              title="Download processed file"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          
          {isLargeFile && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={handleCompress}
              title="Compress file"
            >
              <Package className="w-4 h-4" />
            </Button>
          )}
          
          {onReanalyze && (isDone || isError) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => onReanalyze(fileId)}
              title="Re-analyze file"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
              onClick={() => onRemove(fileId)}
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        file={getModalFile()}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />

      {/* Compression Modal */}
      <FileCompressionModal
        file={getModalFile()}
        isOpen={showCompressionModal}
        onClose={() => setShowCompressionModal(false)}
        onCompress={handleCompression}
      />
    </motion.div>
  );
}
