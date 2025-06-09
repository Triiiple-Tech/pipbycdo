# Chat Agent Router Service
# Handles routing chat messages to appropriate agents and generating responses

import time
import logging
from typing import Dict, Any, Optional
from backend.agents.manager_agent import ManagerAgent
from backend.app.schemas import AppState
from backend.services.gpt_handler import run_llm
from backend.services.llm_selector import select_llm

logger = logging.getLogger(__name__)

class AgentRouter:
    """Routes chat messages to appropriate agents and manages responses"""
    
    def __init__(self):
        self.manager_agent = ManagerAgent()
    
    async def process_user_message(
        self, 
        session_id: str, 
        user_message: str, 
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Process a user message and generate an agent response
        
        Returns:
            Dict containing response content, agent_type, metadata, etc.
        """
        start_time = time.time()
        
        # Get LLM configuration for manager agent
        llm_config = select_llm("manager", {})
        
        try:
            # Create app state for processing
            app_state = AppState()
            app_state.query = user_message
            app_state.session_id = session_id
            app_state.user_id = user_id
            
            # Check if this is a Smartsheet URL or other agent-processable request
            if self._should_use_agent_processing(user_message):
                logger.info(f"Using agent processing for message: {user_message[:100]}...")
                # Use actual agent processing through ManagerAgent
                result_state = self.manager_agent.process(app_state)
                logger.info(f"Agent processing completed. State has {len(result_state.agent_trace) if result_state.agent_trace else 0} trace entries")
                
                # Extract response content from agent trace or generate summary
                response_content = self._extract_agent_response(result_state)
                agent_type = "manager"
                confidence = 0.95
                sources = ["agent_processing", "manager_agent"]
            else:
                logger.info(f"Using simple LLM response for message: {user_message[:100]}...")
                # Use simple LLM response for general chat
                response_content = self._generate_response(user_message)
                agent_type = "manager"
                confidence = 0.85
                sources = ["openai_api", "simple_response"]
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return {
                "content": response_content,
                "agent_type": agent_type,
                "model": llm_config.get("model") or "gpt-4o",
                "token_cost": len(user_message.split()) + len(response_content.split()),  # Approximate token count
                "processing_time": processing_time,
                "confidence": confidence,
                "sources": sources
            }
            
        except Exception as e:
            logger.error(f"Error processing user message: {e}")
            return {
                "content": "I encountered an issue processing your request. Could you please rephrase or try again?",
                "agent_type": "system",
                "model": "fallback",
                "token_cost": 0,
                "processing_time": int((time.time() - start_time) * 1000),
                "confidence": 0.5,
                "sources": ["error_handling"]
            }
    
    def _generate_response(self, user_message: str) -> str:
        """Generate a real AI response using OpenAI models"""
        
        try:
            # Get LLM configuration for manager agent
            llm_config = select_llm("manager", {})
            model = llm_config.get("model") or "gpt-4o"  # Fallback to gpt-4o if None
            api_key = llm_config.get("api_key")
            
            # Create a comprehensive system prompt for construction AI assistant
            system_prompt = """You are PIP AI, an expert construction document analysis and cost estimation assistant. 

Your capabilities include:
- Analyzing construction documents (PDFs, drawings, specifications)
- Generating detailed cost estimates and takeoffs
- Identifying construction trades and project scope
- Integrating with project management tools like Smartsheet
- Providing construction industry expertise and guidance

You should:
- Be helpful, accurate, and professional
- Focus on construction and project management topics
- Provide actionable insights and recommendations
- Ask clarifying questions when needed
- Offer to help with document upload and analysis

Keep responses concise but comprehensive, and always maintain a helpful, expert tone."""

            # Generate real AI response
            response = run_llm(
                prompt=user_message,
                model=model,
                system_prompt=system_prompt,
                api_key=api_key,
                agent_name="manager",
                max_completion_tokens=500,  # Use max_completion_tokens for newer models
                temperature=0.7
            )
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            # Fallback to a simple response if AI fails
            return "I'm having trouble processing your request at the moment. Please try again or contact support if the issue persists."
    
    def _should_use_agent_processing(self, user_message: str) -> bool:
        """Determine if the message should be processed by agents or just simple LLM response."""
        import re
        
        # Check for Smartsheet URLs
        smartsheet_patterns = [
            r'https?://app\.smartsheet\.com/sheets/[\w\-_]+',
            r'https?://app\.smartsheet\.com/b/home\?lx=[\w\-_]+', 
            r'https?://[\w\-]+\.smartsheet\.com/sheets/[\w\-_]+'
        ]
        
        for pattern in smartsheet_patterns:
            if re.search(pattern, user_message):
                logger.info(f"Detected Smartsheet URL pattern: {pattern}")
                return True
        
        # Check for other agent-processable content
        message_lower = user_message.lower()
        agent_keywords = [
            "upload", "file", "document", "analyze", "estimate", 
            "cost", "takeoff", "scope", "export", "smartsheet"
        ]
        
        has_keywords = any(keyword in message_lower for keyword in agent_keywords)
        if has_keywords:
            logger.info(f"Detected agent keywords in message: {user_message[:100]}...")
        
        return has_keywords
    
    def _extract_agent_response(self, state: AppState) -> str:
        """Extract a meaningful response from the agent processing results."""
        logger.info(f"Extracting agent response from state: agent_trace={len(state.agent_trace) if state.agent_trace else 0} entries")
        
        # First, check for pending user action (like Smartsheet file selection)
        if state.pending_user_action:
            logger.info(f"Found pending user action: {state.pending_user_action[:100]}...")
            return state.pending_user_action
        
        # Check if there are any agent trace entries
        if state.agent_trace:
            logger.info(f"Agent trace entries: {[t.decision for t in state.agent_trace[-3:]]}")
            # Get the last few trace entries for summary
            recent_traces = state.agent_trace[-3:]
            
            # Look for specific SmartsheetAgent responses
            smartsheet_traces = [t for t in recent_traces if "smartsheet" in t.decision.lower()]
            if smartsheet_traces:
                last_smartsheet = smartsheet_traces[-1]
                if "no smartsheet token provided" in last_smartsheet.decision.lower():
                    return "🔗 **Smartsheet URL Detected!** 📊\n\nI can see you've shared a Smartsheet link. To access and analyze this sheet, I'll need your Smartsheet access token.\n\n**What I can do with your Smartsheet:**\n• 📋 Analyze sheet structure and data\n• 📤 Export to various formats (PDF, Excel, CSV)\n• 🔄 Sync with PIP AI project estimates\n• ⚡ Set up automated workflows\n• 📊 Generate cost analysis reports\n\nTo get started, please provide your Smartsheet access token or let me know what specific analysis you'd like me to perform!"
                elif "smartsheet completed" in last_smartsheet.decision.lower():
                    return "✅ Smartsheet integration completed successfully! The sheet has been processed and integrated with PIP AI."
                elif "smartsheet" in last_smartsheet.decision.lower():
                    # Generic smartsheet processing message
                    return f"📊 Smartsheet Processing: {last_smartsheet.decision}"
            
            # Look for general success traces
            success_traces = [t for t in recent_traces if t.level == "success"]
            if success_traces:
                last_success = success_traces[-1]
                logger.info(f"Found success trace: {last_success.decision}")
                return f"✅ {last_success.decision}"
            
            # Look for warning traces (like token issues)
            warning_traces = [t for t in recent_traces if t.level == "warning"]
            if warning_traces:
                last_warning = warning_traces[-1]
                if "smartsheet" in last_warning.decision.lower():
                    return f"⚠️ Smartsheet detected but {last_warning.decision.lower()}"
        
        # Check for Smartsheet-specific results
        if state.metadata and state.metadata.get("smartsheet"):
            smartsheet_info = state.metadata["smartsheet"]
            logger.info(f"Found Smartsheet metadata: {smartsheet_info}")
            if "sheet_url" in smartsheet_info:
                return f"✅ Successfully processed Smartsheet: {smartsheet_info['sheet_url']}"
            elif "sheet_id" in smartsheet_info:
                return f"✅ Successfully processed Smartsheet with ID: {smartsheet_info['sheet_id']}"
        
        # Check for errors
        if state.error:
            logger.info(f"Found error: {state.error}")
            return f"❌ Error: {state.error}"
        
        # Check for estimates
        if state.estimate and len(state.estimate) > 0:
            total_items = len(state.estimate)
            logger.info(f"Found estimate with {total_items} items")
            return f"✅ Generated estimate with {total_items} items"
        
        # Default response
        logger.info("Using default response - no specific results found")
        return "✅ Request processed successfully"
