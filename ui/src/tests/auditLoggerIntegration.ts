/**
 * Frontend audit logger integration test
 * This file tests the frontend audit logger service with the actual backend API
 */

import { auditLogger } from '../services/auditLogger';

/**
 * Simple function to test the auditLogger against the real backend
 * Run this in a browser environment by importing and calling testAuditLogger()
 */
export async function testAuditLogger() {
  console.log('Starting audit logger integration test...');
  const results = {
    userAction: false,
    fileUpload: false,
    agentCall: false,
    promptEdit: false,
    systemEvent: false,
  };

  try {
    // Test user action logging
    await auditLogger.logUserAction(
      'integration-test',
      'Testing user action logging',
      `test-session-${Date.now()}`
    );
    console.log('✅ User action log successful');
    results.userAction = true;

    // Test file upload logging
    await auditLogger.logFileUpload(
      'test-file.pdf',
      1024000,
      'application/pdf',
      `test-session-${Date.now()}`
    );
    console.log('✅ File upload log successful');
    results.fileUpload = true;

    // Test agent call logging
    await auditLogger.logAgentCall(
      'test-agent',
      'Testing agent call logging',
      'gpt-4',
      0.05,
      1200,
      `test-session-${Date.now()}`
    );
    console.log('✅ Agent call log successful');
    results.agentCall = true;

    // Test prompt edit logging
    await auditLogger.logPromptEdit(
      'Test Template',
      'updated',
      `test-session-${Date.now()}`
    );
    console.log('✅ Prompt edit log successful');
    results.promptEdit = true;

    // Test system event logging
    await auditLogger.logSystemEvent(
      'integration-test',
      'Testing system event logging',
      'info'
    );
    console.log('✅ System event log successful');
    results.systemEvent = true;

    console.log('All tests completed successfully!');
    return results;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { ...results, error };
  }
}

/**
 * Use this function to validate the audit logs UI panel 
 * by checking if logs from testAuditLogger() appear
 */
export async function validateAuditLogsPanel() {
  // This function would be run in an E2E test that interacts with the UI
  console.log('This function would check if logs appear in the UI panel');
  console.log('Implement in a full E2E test suite');
}

// For direct execution in a browser console
if (typeof window !== 'undefined') {
  (window as any).testAuditLogger = testAuditLogger;
}
