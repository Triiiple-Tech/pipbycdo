import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, FileDown, Zap, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface FileCompressionModalProps {
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
    originalFile?: File; // Add original File object for API calls
  };
  onCompress: (compressedFile: File, compressionInfo: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    quality: string;
  }) => void;
  className?: string;
}

interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  qualityValue: number; // For display purposes
}

export function FileCompressionModal({
  isOpen,
  onClose,
  file,
  onCompress,
  className
}: FileCompressionModalProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    qualityValue: 0.7
  });
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [compressionError, setCompressionError] = useState<string | null>(null);

  // Get compression estimation when the modal opens or quality changes
  useEffect(() => {
    if (isOpen && file.originalFile) {
      const getEstimation = async () => {
        try {
          const estimation = await apiService.estimateCompression(file.originalFile!, settings.quality);
          setEstimatedSize(estimation.estimated_compressed_size);
        } catch (error) {
          console.error('Failed to get compression estimation:', error);
          // Fallback to simple estimation
          setEstimatedSize(file.size * settings.qualityValue);
        }
      };
      getEstimation();
    }
  }, [isOpen, file.originalFile, settings.quality]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentSizeInMB = file.size / (1024 * 1024);
  const isLargeFile = currentSizeInMB > 75;
  const estimatedCompressedSize = estimatedSize || file.size * settings.qualityValue;

  const handleCompress = async () => {
    if (!file.originalFile) {
      setCompressionError('Original file not available for compression');
      return;
    }

    setIsCompressing(true);
    setCompressionProgress(0);
    setCompressionError(null);

    try {
      // Simulate progress updates while compression happens
      const progressInterval = setInterval(() => {
        setCompressionProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const compressionResult = await apiService.compressFile(file.originalFile, settings.quality);
      
      clearInterval(progressInterval);
      setCompressionProgress(100);

      // Convert blob back to File object
      const compressedFile = new File(
        [compressionResult.compressed_file],
        `compressed_${file.originalFile.name}`,
        { type: file.originalFile.type }
      );

      // Call the compression callback with the compressed file and info
      onCompress(compressedFile, {
        originalSize: compressionResult.original_size,
        compressedSize: compressionResult.compressed_size,
        compressionRatio: compressionResult.compression_ratio,
        quality: compressionResult.quality_setting
      });

      onClose();
    } catch (error) {
      console.error('Compression failed:', error);
      setCompressionError(error instanceof Error ? error.message : 'Compression failed');
      setIsCompressing(false);
    }
  };

  const handleSkipCompression = () => {
    if (file.originalFile) {
      // Call with original file and no compression info
      onCompress(file.originalFile, {
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        quality: 'none'
      });
    }
    onClose();
  };

  const getCompressionAdvice = () => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return {
          title: "PDF Compression",
          description: "We can reduce PDF file size by optimizing images and removing unnecessary data.",
          methods: ["Image optimization", "Font subsetting", "Remove metadata"]
        };
      case 'jpg':
      case 'jpeg':
      case 'png':
        return {
          title: "Image Compression",
          description: "Reduce image quality while maintaining visual clarity for faster upload.",
          methods: ["Quality reduction", "Format optimization", "Resolution scaling"]
        };
      case 'docx':
        return {
          title: "Document Compression",
          description: "Compress embedded images and remove unnecessary formatting data.",
          methods: ["Image compression", "Remove track changes", "Optimize embedded objects"]
        };
      default:
        return {
          title: "File Compression",
          description: "Apply general compression algorithms to reduce file size.",
          methods: ["ZIP compression", "Remove duplicates", "Data optimization"]
        };
    }
  };

  const advice = getCompressionAdvice();

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
                "relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Large File Detected
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {file.name} • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-8 h-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Warning Message */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        File size exceeds recommended limit
                      </h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Files larger than 75MB may experience slower processing times. 
                        We recommend compressing the file for optimal performance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compression Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    {advice.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {advice.description}
                  </p>
                  
                  {/* Compression Methods */}
                  <div className="grid grid-cols-1 gap-2">
                    {advice.methods.map((method, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check className="w-4 h-4 text-green-500" />
                        {method}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size Comparison */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Size</div>
                    <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Estimated After</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatFileSize(estimatedCompressedSize)}
                    </div>
                  </div>
                </div>

                {/* Quality Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Compression Level
                    </label>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {Math.round((1 - settings.qualityValue) * 100)}% reduction
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['high', 'medium', 'low'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSettings(prev => ({ 
                          quality: level,
                          qualityValue: level === 'high' ? 0.85 : level === 'medium' ? 0.7 : 0.55
                        }))}
                        disabled={isCompressing}
                        className={cn(
                          "px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
                          settings.quality === level
                            ? "bg-cdo-red text-white border-cdo-red"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                        )}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>Best Quality</span>
                    <span>Smallest Size</span>
                  </div>
                </div>

                {/* Error Display */}
                {compressionError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {compressionError}
                    </p>
                  </div>
                )}

                {/* Progress Bar (only shown during compression) */}
                <AnimatePresence>
                  {isCompressing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Compressing...
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {compressionProgress}%
                        </span>
                      </div>
                      <Progress value={compressionProgress} className="h-2" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={handleSkipCompression}
                  disabled={isCompressing}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Upload Without Compression
                </Button>
                
                <Button
                  onClick={handleCompress}
                  disabled={isCompressing}
                  className="bg-cdo-red hover:bg-cdo-red/90 text-white"
                >
                  {isCompressing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Compress & Upload
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
