import { v4 as uuidv4 } from 'uuid';

export interface AuditLogParams {
  user_id?: string;
  user_email?: string;
  agent: string;
  event_type: 'file_upload' | 'agent_call' | 'sheet_export' | 'prompt_edit' | 'user_action' | 'system_event';
  event_details: string;
  model_used?: string;
  session_id?: string;
  task_id?: string;
  cost_estimate?: number;
  duration_ms?: number;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  error?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private readonly baseUrl = '/api/analytics';

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event to the backend
   */
  public async logEvent(params: AuditLogParams): Promise<void> {
    try {
      const payload = {
        ...params,
        user_id: params.user_id || 'demo-user',
        user_email: params.user_email || 'demo@pipai.com',
        session_id: params.session_id || this.getCurrentSessionId(),
        task_id: params.task_id || uuidv4(),
        level: params.level || 'info',
        timestamp: new Date().toISOString(),
        ip_address: '127.0.0.1', // Client IP would normally be handled by backend
        user_agent: navigator.userAgent
      };

      const response = await fetch(`${this.baseUrl}/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Failed to log audit event:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to log audit event:', error);
    }
  }

  /**
   * Log a file upload event
   */
  public async logFileUpload(fileName: string, fileSize: number, fileType: string, sessionId?: string): Promise<void> {
    await this.logEvent({
      agent: 'file-reader',
      event_type: 'file_upload',
      event_details: `Uploaded ${fileName} (${this.formatFileSize(fileSize)}, ${fileType})`,
      session_id: sessionId,
      level: 'info'
    });
  }

  /**
   * Log an agent call event
   */
  public async logAgentCall(
    agentType: string, 
    details: string, 
    modelUsed: string, 
    costEstimate?: number, 
    durationMs?: number,
    sessionId?: string,
    error?: string
  ): Promise<void> {
    await this.logEvent({
      agent: agentType,
      event_type: 'agent_call',
      event_details: details,
      model_used: modelUsed,
      cost_estimate: costEstimate,
      duration_ms: durationMs,
      session_id: sessionId,
      level: error ? 'error' : 'info',
      error
    });
  }

  /**
   * Log a user action event
   */
  public async logUserAction(action: string, details: string, sessionId?: string): Promise<void> {
    await this.logEvent({
      agent: 'system',
      event_type: 'user_action',
      event_details: `${action}: ${details}`,
      session_id: sessionId,
      level: 'info'
    });
  }

  /**
   * Log a prompt template edit event
   */
  public async logPromptEdit(templateName: string, action: 'created' | 'updated' | 'deleted', sessionId?: string): Promise<void> {
    await this.logEvent({
      agent: 'system',
      event_type: 'prompt_edit',
      event_details: `Template '${templateName}' was ${action}`,
      session_id: sessionId,
      level: 'info'
    });
  }

  /**
   * Log a Smartsheet export event
   */
  public async logSheetExport(exportType: string, fileName: string, sessionId?: string): Promise<void> {
    await this.logEvent({
      agent: 'exporter',
      event_type: 'sheet_export',
      event_details: `Exported ${exportType} to ${fileName}`,
      session_id: sessionId,
      level: 'info'
    });
  }

  /**
   * Log a system event
   */
  public async logSystemEvent(event: string, details: string, level: 'debug' | 'info' | 'warning' | 'error' | 'critical' = 'info'): Promise<void> {
    await this.logEvent({
      agent: 'system',
      event_type: 'system_event',
      event_details: `${event}: ${details}`,
      level
    });
  }

  /**
   * Get current session ID from localStorage
   */
  private getCurrentSessionId(): string {
    return localStorage.getItem('pipSessionId') || 'default-session';
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export a singleton instance
export const auditLogger = AuditLogger.getInstance();
