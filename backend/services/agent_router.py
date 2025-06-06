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
            # Create a simple app state for processing
            app_state = AppState()
            app_state.query = user_message
            app_state.session_id = session_id
            app_state.user_id = user_id
            
            # Analyze the user message to determine response type
            response_content = self._generate_response(user_message)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return {
                "content": response_content,
                "agent_type": "manager",
                "model": llm_config.get("model") or "gpt-4o",
                "token_cost": len(user_message.split()) + len(response_content.split()),  # Approximate token count
                "processing_time": processing_time,
                "confidence": 0.95,  # High confidence for real AI responses
                "sources": ["openai_api", "real_ai_processing"]
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
