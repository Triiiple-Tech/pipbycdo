/**
 * Tests for the audit logging service - run with Jest
 */
import { auditLogger } from '../services/auditLogger';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Audit Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch response
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Audit log entry created successfully' })
      })
    );
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'test-session-id'),
        setItem: jest.fn(),
      },
      writable: true
    });
    
    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'test-user-agent',
      writable: true
    });
  });
  
  test('logEvent sends correct payload to API', async () => {
    const testParams = {
      agent: 'test-agent',
      event_type: 'user_action',
      event_details: 'Test action',
      model_used: 'gpt-4',
      level: 'info'
    };
    
    await auditLogger.logEvent(testParams);
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/analytics/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String)
    });
    
    // Check that sent payload contains expected data
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(payload.agent).toBe('test-agent');
    expect(payload.event_type).toBe('user_action');
    expect(payload.event_details).toBe('Test action');
    expect(payload.model_used).toBe('gpt-4');
    expect(payload.level).toBe('info');
    expect(payload.session_id).toBe('test-session-id');
    expect(payload.user_agent).toBe('test-user-agent');
  });
  
  test('logFileUpload correctly formats file details', async () => {
    await auditLogger.logFileUpload('test.pdf', 1024000, 'application/pdf');
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    
    expect(payload.agent).toBe('file-reader');
    expect(payload.event_type).toBe('file_upload');
    expect(payload.event_details).toContain('test.pdf');
    expect(payload.event_details).toContain('1000 KB'); // Verify formatting
    expect(payload.event_details).toContain('application/pdf');
  });
  
  test('logAgentCall correctly logs agent activity', async () => {
    await auditLogger.logAgentCall(
      'manager',
      'Processing request',
      'gpt-4',
      0.05,
      1200,
      'test-session',
      null
    );
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    
    expect(payload.agent).toBe('manager');
    expect(payload.event_type).toBe('agent_call');
    expect(payload.event_details).toBe('Processing request');
    expect(payload.model_used).toBe('gpt-4');
    expect(payload.cost_estimate).toBe(0.05);
    expect(payload.duration_ms).toBe(1200);
    expect(payload.session_id).toBe('test-session');
    expect(payload.level).toBe('info'); // No error, so level is info
  });
  
  test('logAgentCall correctly logs error cases', async () => {
    await auditLogger.logAgentCall(
      'manager',
      'Failed to process',
      'gpt-4',
      null,
      1500,
      'test-session',
      'API Error'
    );
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    
    expect(payload.level).toBe('error'); // With error, level should be error
    expect(payload.error).toBe('API Error');
  });
  
  test('handles fetch errors gracefully', async () => {
    // Mock fetch to fail
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );
    
    // Add a spy on console.warn
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    await auditLogger.logUserAction('test-action', 'Test details');
    
    // Should not throw, but log a warning
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toBe('Failed to log audit event:');
    
    consoleSpy.mockRestore();
  });
});
