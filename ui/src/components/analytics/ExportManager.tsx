import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  Calendar,
  Settings,
  X,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { cn } from '../../../lib/utils';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'png' | 'json';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  includeCharts: boolean;
  includeData: boolean;
  includeSummary: boolean;
  selectedMetrics: string[];
  selectedProjects: string[];
  fileName: string;
  compression: boolean;
}

export interface ExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  className?: string;
  availableMetrics?: { id: string; name: string }[];
  availableProjects?: { id: string; name: string }[];
  defaultFileName?: string;
}

const EXPORT_FORMATS = [
  {
    id: 'pdf',
    name: 'PDF Report',
    description: 'Comprehensive report with charts and data',
    icon: FileText,
    color: 'bg-red-100 text-red-800',
    extensions: ['.pdf'],
    supportsCharts: true,
    supportsData: true
  },
  {
    id: 'excel',
    name: 'Excel Workbook',
    description: 'Spreadsheet with multiple sheets and data',
    icon: FileSpreadsheet,
    color: 'bg-green-100 text-green-800',
    extensions: ['.xlsx', '.xls'],
    supportsCharts: true,
    supportsData: true
  },
  {
    id: 'csv',
    name: 'CSV Data',
    description: 'Raw data in comma-separated format',
    icon: FileSpreadsheet,
    color: 'bg-blue-100 text-blue-800',
    extensions: ['.csv'],
    supportsCharts: false,
    supportsData: true
  },
  {
    id: 'png',
    name: 'PNG Images',
    description: 'High-resolution chart images',
    icon: Image,
    color: 'bg-purple-100 text-purple-800',
    extensions: ['.png'],
    supportsCharts: true,
    supportsData: false
  },
  {
    id: 'json',
    name: 'JSON Data',
    description: 'Structured data for API integration',
    icon: FileText,
    color: 'bg-orange-100 text-orange-800',
    extensions: ['.json'],
    supportsCharts: false,
    supportsData: true
  }
] as const;

export const ExportManager: React.FC<ExportManagerProps> = ({
  isOpen,
  onClose,
  onExport,
  className,
  availableMetrics = [],
  availableProjects = [],
  defaultFileName = 'analytics-export'
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: { from: null, to: null },
    includeCharts: true,
    includeData: true,
    includeSummary: true,
    selectedMetrics: [],
    selectedProjects: [],
    fileName: defaultFileName,
    compression: false
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedFormat = EXPORT_FORMATS.find(f => f.id === exportOptions.format);

  // Handle export
  const handleExport = async () => {
    if (!selectedFormat) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onExport(exportOptions);

      clearInterval(progressInterval);
      setExportProgress(100);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Update export options
  const updateOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  // Generate filename with timestamp
  const generateFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = selectedFormat?.extensions[0] || '';
    return `${exportOptions.fileName}-${timestamp}${extension}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn('relative w-full max-w-2xl max-h-[90vh] overflow-hidden', className)}
        >
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#E60023]/10 rounded-lg">
                    <Download className="h-5 w-5 text-[#E60023]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Export Analytics Data</h2>
                    <p className="text-sm text-gray-600">Download your analytics data in various formats</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Export Format Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EXPORT_FORMATS.map((format) => {
                    const IconComponent = format.icon;
                    const isSelected = exportOptions.format === format.id;

                    return (
                      <motion.div
                        key={format.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className={cn(
                            'p-4 rounded-lg border cursor-pointer transition-all duration-200',
                            isSelected
                              ? 'border-[#E60023] bg-[#E60023]/5 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          )}
                          onClick={() => updateOptions({ format: format.id as any })}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn('p-2 rounded-lg', format.color)}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">{format.name}</h4>
                                {isSelected && <Check className="h-4 w-4 text-[#E60023]" />}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{format.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                {format.supportsCharts && (
                                  <Badge variant="secondary" className="text-xs">Charts</Badge>
                                )}
                                {format.supportsData && (
                                  <Badge variant="secondary" className="text-xs">Data</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Export Options */}
              {selectedFormat && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Export Options</h3>
                  <div className="space-y-3">
                    {selectedFormat.supportsCharts && (
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeCharts}
                          onChange={(e) => updateOptions({ includeCharts: e.target.checked })}
                          className="rounded border-gray-300 text-[#E60023] focus:ring-[#E60023]"
                        />
                        <span className="text-sm text-gray-700">Include charts and visualizations</span>
                      </label>
                    )}

                    {selectedFormat.supportsData && (
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeData}
                          onChange={(e) => updateOptions({ includeData: e.target.checked })}
                          className="rounded border-gray-300 text-[#E60023] focus:ring-[#E60023]"
                        />
                        <span className="text-sm text-gray-700">Include raw data</span>
                      </label>
                    )}

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeSummary}
                        onChange={(e) => updateOptions({ includeSummary: e.target.checked })}
                        className="rounded border-gray-300 text-[#E60023] focus:ring-[#E60023]"
                      />
                      <span className="text-sm text-gray-700">Include executive summary</span>
                    </label>
                  </div>
                </div>
              )}

              {/* File Name */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">File Name</h3>
                <div className="space-y-2">
                  <Input
                    value={exportOptions.fileName}
                    onChange={(e) => updateOptions({ fileName: e.target.value })}
                    placeholder="Enter file name"
                    className="border-gray-200 focus:border-[#E60023]"
                  />
                  <p className="text-xs text-gray-500">
                    Preview: {generateFileName()}
                  </p>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Options
                  <ChevronDown className={cn(
                    'h-4 w-4 ml-2 transition-transform duration-200',
                    showAdvanced && 'rotate-180'
                  )} />
                </Button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={exportOptions.compression}
                            onChange={(e) => updateOptions({ compression: e.target.checked })}
                            className="rounded border-gray-300 text-[#E60023] focus:ring-[#E60023]"
                          />
                          <span className="text-sm text-gray-700">Compress file (ZIP)</span>
                        </label>

                        {/* Date Range */}
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-2 block">Date Range (Optional)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={exportOptions.dateRange.from?.toISOString().split('T')[0] || ''}
                              onChange={(e) => updateOptions({
                                dateRange: {
                                  ...exportOptions.dateRange,
                                  from: e.target.value ? new Date(e.target.value) : null
                                }
                              })}
                              className="px-3 py-2 text-xs border border-gray-200 rounded-md focus:border-[#E60023] focus:outline-none"
                            />
                            <input
                              type="date"
                              value={exportOptions.dateRange.to?.toISOString().split('T')[0] || ''}
                              onChange={(e) => updateOptions({
                                dateRange: {
                                  ...exportOptions.dateRange,
                                  to: e.target.value ? new Date(e.target.value) : null
                                }
                              })}
                              className="px-3 py-2 text-xs border border-gray-200 rounded-md focus:border-[#E60023] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error Display */}
              {exportError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">{exportError}</span>
                  </div>
                </motion.div>
              )}

              {/* Export Progress */}
              {isExporting && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Exporting...</span>
                    <span className="text-gray-600">{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-[#E60023] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedFormat && (
                    <span>Format: {selectedFormat.name}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isExporting}
                    className="border-gray-200 hover:border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={isExporting || !exportOptions.fileName.trim()}
                    className="bg-[#E60023] hover:bg-[#CC001F] text-white"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportManager;
