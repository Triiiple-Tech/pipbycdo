import { useState, useCallback } from 'react';
import { ExportOptions } from '../components/analytics/ExportManager';

export interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
  options: ExportOptions;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportOptions['format'];
  defaultOptions: Partial<ExportOptions>;
  isCustom: boolean;
}

export interface UseDataExportReturn {
  jobs: ExportJob[];
  templates: ExportTemplate[];
  isExporting: boolean;
  createExport: (options: ExportOptions) => Promise<string>;
  cancelExport: (jobId: string) => Promise<void>;
  downloadExport: (jobId: string) => Promise<void>;
  deleteExport: (jobId: string) => Promise<void>;
  createTemplate: (template: Omit<ExportTemplate, 'id' | 'isCustom'>) => Promise<string>;
  deleteTemplate: (templateId: string) => Promise<void>;
  getJobStatus: (jobId: string) => ExportJob | undefined;
  clearCompletedJobs: () => void;
}

// Default export templates
const DEFAULT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview for executives',
    format: 'pdf',
    defaultOptions: {
      format: 'pdf',
      includeCharts: true,
      includeData: false,
      includeSummary: true,
      selectedMetrics: ['revenue', 'project_completion', 'client_satisfaction'],
      fileName: 'executive-summary'
    },
    isCustom: false
  },
  {
    id: 'detailed-report',
    name: 'Detailed Analytics Report',
    description: 'Comprehensive report with all data',
    format: 'pdf',
    defaultOptions: {
      format: 'pdf',
      includeCharts: true,
      includeData: true,
      includeSummary: true,
      selectedMetrics: [],
      fileName: 'detailed-analytics-report'
    },
    isCustom: false
  },
  {
    id: 'data-export',
    name: 'Raw Data Export',
    description: 'CSV export for data analysis',
    format: 'csv',
    defaultOptions: {
      format: 'csv',
      includeCharts: false,
      includeData: true,
      includeSummary: false,
      selectedMetrics: [],
      fileName: 'analytics-data'
    },
    isCustom: false
  },
  {
    id: 'dashboard-charts',
    name: 'Dashboard Charts',
    description: 'PNG images of all charts',
    format: 'png',
    defaultOptions: {
      format: 'png',
      includeCharts: true,
      includeData: false,
      includeSummary: false,
      selectedMetrics: [],
      fileName: 'dashboard-charts',
      compression: true
    },
    isCustom: false
  }
];

// Export processors for different formats
const processExport = async (options: ExportOptions, updateProgress: (progress: number) => void): Promise<string> => {
  const { format, fileName } = options;
  
  // Simulate export processing with progress updates
  const steps = [
    'Gathering data...',
    'Processing metrics...',
    'Generating charts...',
    'Creating document...',
    'Finalizing export...'
  ];

  for (let i = 0; i < steps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800));
    updateProgress((i + 1) * 20);
  }

  // Generate mock download URL
  const timestamp = Date.now();
  const extension = getFileExtension(format);
  const downloadUrl = `https://api.pipbycdo.com/exports/${timestamp}-${fileName}${extension}`;

  return downloadUrl;
};

const getFileExtension = (format: ExportOptions['format']): string => {
  const extensions = {
    pdf: '.pdf',
    excel: '.xlsx',
    csv: '.csv',
    png: '.zip',
    json: '.json'
  };
  return extensions[format] || '.pdf';
};

// Generate mock file content for download
const generateFileContent = (options: ExportOptions): Blob => {
  const { format, includeData, includeCharts, includeSummary } = options;

  switch (format) {
    case 'json':
      const jsonData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          format,
          options
        },
        summary: includeSummary ? {
          totalProjects: 24,
          activeProjects: 12,
          totalRevenue: 2450000,
          avgSatisfaction: 4.3
        } : undefined,
        data: includeData ? {
          projects: [
            { id: 1, name: 'Project A', status: 'active', budget: 150000 },
            { id: 2, name: 'Project B', status: 'completed', budget: 75000 }
          ],
          metrics: [
            { name: 'Revenue', value: 2450000, unit: 'USD' },
            { name: 'Satisfaction', value: 4.3, unit: 'stars' }
          ]
        } : undefined,
        charts: includeCharts ? {
          availableCharts: ['revenue-trend', 'project-status', 'team-performance']
        } : undefined
      };
      return new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });

    case 'csv':
      const csvData = [
        'Date,Revenue,Projects,Satisfaction',
        '2024-01-01,80000,12,4.2',
        '2024-01-02,85000,12,4.3',
        '2024-01-03,82000,13,4.1'
      ].join('\n');
      return new Blob([csvData], { type: 'text/csv' });

    default:
      // For PDF, Excel, PNG - return a placeholder
      return new Blob(['Export content placeholder'], { type: 'application/octet-stream' });
  }
};

export const useDataExport = (): UseDataExportReturn => {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [templates, setTemplates] = useState<ExportTemplate[]>(DEFAULT_TEMPLATES);
  const [isExporting, setIsExporting] = useState(false);

  // Create a new export job
  const createExport = useCallback(async (options: ExportOptions): Promise<string> => {
    const jobId = `export-${Date.now()}`;
    
    const newJob: ExportJob = {
      id: jobId,
      name: options.fileName || 'Analytics Export',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      options
    };

    setJobs(prev => [newJob, ...prev]);
    setIsExporting(true);

    try {
      // Update job status to processing
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'processing' }
          : job
      ));

      // Process export with progress updates
      const downloadUrl = await processExport(options, (progress) => {
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, progress }
            : job
        ));
      });

      // Mark as completed
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'completed', 
              progress: 100, 
              completedAt: new Date(),
              downloadUrl 
            }
          : job
      ));

      return jobId;
    } catch (error) {
      // Mark as failed
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Export failed' 
            }
          : job
      ));
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Cancel an export job
  const cancelExport = useCallback(async (jobId: string): Promise<void> => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== 'processing') {
      throw new Error('Cannot cancel this export');
    }

    // Simulate cancellation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'failed', error: 'Export cancelled by user' }
        : job
    ));
  }, [jobs]);

  // Download an export
  const downloadExport = useCallback(async (jobId: string): Promise<void> => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== 'completed' || !job.downloadUrl) {
      throw new Error('Export not available for download');
    }

    try {
      // Generate file content
      const blob = generateFileContent(job.options);
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.options.fileName}${getFileExtension(job.options.format)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Failed to download export');
    }
  }, [jobs]);

  // Delete an export job
  const deleteExport = useCallback(async (jobId: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  // Create a new template
  const createTemplate = useCallback(async (
    template: Omit<ExportTemplate, 'id' | 'isCustom'>
  ): Promise<string> => {
    const templateId = `template-${Date.now()}`;
    
    const newTemplate: ExportTemplate = {
      ...template,
      id: templateId,
      isCustom: true
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTemplates(prev => [newTemplate, ...prev]);
    return templateId;
  }, []);

  // Delete a template
  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    const template = templates.find(t => t.id === templateId);
    if (!template?.isCustom) {
      throw new Error('Cannot delete default templates');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, [templates]);

  // Get job status
  const getJobStatus = useCallback((jobId: string): ExportJob | undefined => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  // Clear completed jobs
  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(job => 
      job.status !== 'completed' && job.status !== 'failed'
    ));
  }, []);

  return {
    jobs,
    templates,
    isExporting,
    createExport,
    cancelExport,
    downloadExport,
    deleteExport,
    createTemplate,
    deleteTemplate,
    getJobStatus,
    clearCompletedJobs
  };
};

export default useDataExport;
