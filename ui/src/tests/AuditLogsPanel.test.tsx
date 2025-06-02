/**
 * Tests for the AuditLogsPanel component
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditLogsPanel } from '../components/pip/AuditLogsPanel';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock data for testing
const mockAuditLogs = {
  logs: [
    {
      id: 'audit-1234',
      timestamp: '2025-06-01T15:30:45',
      user_id: 'test-user',
      user_email: 'test@example.com',
      agent: 'manager',
      event_type: 'user_action',
      event_details: 'User sent message: "Test message"',
      session_id: 'sess-1234',
      level: 'info'
    },
    {
      id: 'audit-5678',
      timestamp: '2025-06-01T15:31:20',
      user_id: 'test-user',
      user_email: 'test@example.com',
      agent: 'file-reader',
      event_type: 'file_upload',
      event_details: 'Uploaded test.pdf (2.5 MB, application/pdf)',
      session_id: 'sess-1234',
      level: 'info'
    },
    {
      id: 'audit-9012',
      timestamp: '2025-06-01T15:32:10',
      user_id: 'test-user',
      user_email: 'test@example.com',
      agent: 'manager',
      event_type: 'agent_call',
      event_details: 'Processing request',
      model_used: 'gpt-4-turbo',
      cost_estimate: 0.034,
      duration_ms: 2300,
      session_id: 'sess-1234',
      level: 'info'
    }
  ],
  total_count: 3,
  page: 1,
  page_size: 50,
  filters_applied: {}
};

const mockAuditStats = {
  total_entries: 3,
  date_range: {
    start: '2025-06-01T00:00:00',
    end: '2025-06-01T23:59:59'
  },
  by_event_type: {
    user_action: 1,
    file_upload: 1,
    agent_call: 1
  },
  by_agent: {
    manager: 2,
    'file-reader': 1
  },
  by_level: {
    info: 3
  },
  cost_summary: {
    total_cost: 0.034,
    average_cost_per_call: 0.034,
    highest_cost: 0.034,
    total_duration_minutes: 0.038
  }
};

describe('AuditLogsPanel', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful fetch for logs
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/analytics/audit-logs?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAuditLogs)
        });
      } 
      else if (url.includes('/api/analytics/audit-logs/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAuditStats)
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
  });
  
  test('displays audit logs from API', async () => {
    // Render the component
    render(<AuditLogsPanel />);
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Check that logs are displayed
    await waitFor(() => {
      expect(screen.getByText('User sent message: "Test message"')).toBeInTheDocument();
      expect(screen.getByText('Uploaded test.pdf (2.5 MB, application/pdf)')).toBeInTheDocument();
      expect(screen.getByText('Processing request')).toBeInTheDocument();
    });
    
    // Check stats are displayed
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total entries
      expect(screen.getByText('$0.03')).toBeInTheDocument(); // Total cost (rounded)
    });
  });
  
  test('applies filters correctly', async () => {
    // Setup mock for filtered response
    global.fetch.mockImplementation((url) => {
      if (url.includes('event_type=file_upload')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockAuditLogs,
            logs: [mockAuditLogs.logs[1]], // Only the file upload log
            total_count: 1
          })
        });
      }
      // Default response for initial load and stats
      if (url.includes('/api/analytics/audit-logs?page=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAuditLogs)
        });
      }
      if (url.includes('/api/analytics/audit-logs/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAuditStats)
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    
    // Render the component
    render(<AuditLogsPanel />);
    
    // Wait for initial API calls to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    // Find and click on the event type filter
    await waitFor(() => {
      const eventTypeSelect = screen.getByText('All Events');
      act(() => {
        userEvent.click(eventTypeSelect);
      });
    });
    
    // Select "File Upload" option
    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload');
      act(() => {
        userEvent.click(fileUploadOption);
      });
    });
    
    // Check that only the file upload log is shown
    await waitFor(() => {
      // Should show the file upload log
      expect(screen.getByText('Uploaded test.pdf (2.5 MB, application/pdf)')).toBeInTheDocument();
      
      // Should not show the other logs
      expect(screen.queryByText('User sent message: "Test message"')).not.toBeInTheDocument();
      expect(screen.queryByText('Processing request')).not.toBeInTheDocument();
    });
  });
  
  test('handles errors gracefully', async () => {
    // Mock a failed fetch
    global.fetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
    });
    
    // Render the component
    render(<AuditLogsPanel />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error loading audit logs')).toBeInTheDocument();
    });
  });
});
