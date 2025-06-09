// Test script to verify frontend direct API hooks are working
// Copy and paste this into the browser console at localhost:3005

console.log("🚀 Testing Frontend Direct API Hooks...");

// Test 1: Direct chat sessions fetch
async function testDirectChatSessions() {
  console.log("📋 Testing direct chat sessions fetch...");
  try {
    const response = await fetch('http://localhost:8000/api/chat/sessions', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const sessions = await response.json();
    console.log("✅ Direct sessions fetch successful:", sessions.length, "sessions");
    console.log("📝 First session:", sessions[0]);
    return sessions;
  } catch (error) {
    console.error("❌ Direct sessions fetch failed:", error);
    return null;
  }
}

// Test 2: Direct message send
async function testDirectMessageSend(sessionId, message) {
  console.log("💬 Testing direct message send...");
  console.log("📨 Session:", sessionId);
  console.log("📝 Message:", message);
  
  try {
    const response = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("✅ Direct message send successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Direct message send failed:", error);
    return null;
  }
}

// Test 3: Check if React hooks are working
function testReactHooks() {
  console.log("⚛️ Testing React hooks availability...");
  
  // Check if we can access React components
  const reactRoots = document.querySelectorAll('[data-reactroot]');
  console.log("🔍 React roots found:", reactRoots.length);
  
  // Check for our specific components
  const chatInterface = document.querySelector('[class*="chat"]');
  console.log("💬 Chat interface found:", !!chatInterface);
  
  // Look for any error indicators
  const errorElements = document.querySelectorAll('[class*="error"]');
  console.log("⚠️ Error elements found:", errorElements.length);
  
  return {
    reactRoots: reactRoots.length,
    chatInterface: !!chatInterface,
    errors: errorElements.length
  };
}

// Test 4: Simulate frontend message sending workflow
async function testFrontendWorkflow() {
  console.log("🔄 Testing complete frontend workflow...");
  
  const sessions = await testDirectChatSessions();
  if (!sessions || sessions.length === 0) {
    console.error("❌ No sessions available for testing");
    return;
  }
  
  const sessionId = sessions[0].id;
  const testMessage = "Frontend integration test - " + new Date().toISOString();
  
  const result = await testDirectMessageSend(sessionId, testMessage);
  if (result) {
    console.log("✅ Frontend workflow test completed successfully");
    
    // Wait for agent response
    console.log("⏳ Waiting for agent response...");
    setTimeout(async () => {
      try {
        const messagesResponse = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}/messages`);
        const messages = await messagesResponse.json();
        const latestMessages = messages.slice(-2);
        console.log("📬 Latest messages:", latestMessages);
      } catch (error) {
        console.error("❌ Failed to fetch latest messages:", error);
      }
    }, 2000);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🧪 Running all frontend integration tests...");
  
  console.log("\n" + "=".repeat(50));
  console.log("TEST 1: React Hooks Check");
  console.log("=".repeat(50));
  const hookResults = testReactHooks();
  
  console.log("\n" + "=".repeat(50));
  console.log("TEST 2: Direct API Calls");
  console.log("=".repeat(50));
  await testFrontendWorkflow();
  
  console.log("\n" + "=".repeat(50));
  console.log("🏁 All tests completed!");
  console.log("=".repeat(50));
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.frontendTests = {
  testDirectChatSessions,
  testDirectMessageSend,
  testReactHooks,
  testFrontendWorkflow,
  runAllTests
};

console.log("📝 Test functions available as window.frontendTests");
console.log("💡 You can run individual tests like: window.frontendTests.testDirectChatSessions()");
