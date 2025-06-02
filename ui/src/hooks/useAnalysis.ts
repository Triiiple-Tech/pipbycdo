import { useState, useCallback } from 'react';
import { apiService, AnalyzeRequest, ProcessedState, TaskStatusResponse } from '@/services/api';

export interface UseAnalysisOptions {
  onProgress?: (update: string) => void;
  onAgentUpdate?: (agentName: string, status: string, details?: string) => void;
  onComplete?: (result: ProcessedState) => void;
  onError?: (error: string) => void;
}

export interface AnalysisState {
  isLoading: boolean;
  taskId: string | null;
  status: 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';
  progress: string;
  result: ProcessedState | null;
  error: string | null;
  agentTrace: Array<{
    agent: string;
    status: string;
    details: string;
    timestamp: string;
  }>;
}

export function useAnalysis(options: UseAnalysisOptions = {}) {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    taskId: null,
    status: 'idle',
    progress: '',
    result: null,
    error: null,
    agentTrace: [],
  });

  const submitAnalysis = useCallback(async (request: AnalyzeRequest) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      status: 'submitting',
      progress: 'Submitting analysis request...',
      error: null,
      result: null,
      agentTrace: [],
    }));

    try {
      // Submit the analysis request
      const response = await apiService.submitAnalysis(request);
      
      setState(prev => ({
        ...prev,
        taskId: response.task_id,
        status: 'processing',
        progress: 'Analysis submitted, processing...',
      }));

      // Start polling for updates
      apiService.pollTaskStatus(
        response.task_id,
        (statusUpdate: TaskStatusResponse) => {
          setState(prev => ({
            ...prev,
            status: statusUpdate.status as any,
            progress: getProgressMessage(statusUpdate),
          }));
          
          options.onProgress?.(getProgressMessage(statusUpdate));
        },
        (result: ProcessedState) => {
          setState(prev => ({
            ...prev,
            isLoading: false,
            status: 'completed',
            progress: 'Analysis completed successfully!',
            result,
            agentTrace: result.agent_trace?.map(trace => ({
              agent: trace.agent,
              status: trace.level,
              details: trace.details,
              timestamp: trace.timestamp,
            })) || [],
          }));
          
          options.onComplete?.(result);
        },
        (error: string) => {
          setState(prev => ({
            ...prev,
            isLoading: false,
            status: 'failed',
            progress: '',
            error,
          }));
          
          options.onError?.(error);
        }
      );

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        status: 'failed',
        progress: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
      
      options.onError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      taskId: null,
      status: 'idle',
      progress: '',
      result: null,
      error: null,
      agentTrace: [],
    });
  }, []);

  return {
    ...state,
    submitAnalysis,
    reset,
  };
}

function getProgressMessage(status: TaskStatusResponse): string {
  switch (status.status) {
    case 'pending':
      return 'Analysis queued for processing...';
    case 'in_progress':
      return 'AI agents are analyzing your project...';
    case 'completed':
      return 'Analysis completed successfully!';
    case 'failed':
      return 'Analysis failed. Please try again.';
    default:
      return 'Processing...';
  }
}
