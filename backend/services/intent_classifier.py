# backend/services/intent_classifier.py
from typing import Dict, List, Optional, Any
from backend.app.schemas import AppState
from backend.services.gpt_handler import run_llm
import logging
import json

logger = logging.getLogger(__name__)

class IntentClassifier:
    """
    LLM-powered intent classification for smart routing decisions.
    Analyzes user queries and content to determine optimal agent sequences.
    """
    
    # Define possible intents and their characteristics
    INTENT_DEFINITIONS: Dict[str, Dict[str, Any]] = {
        "full_estimation": {
            "description": "Complete estimation pipeline from files to final estimate",
            "required_agents": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"],
            "optional_agents": ["exporter"],
            "confidence_threshold": 0.7
        },
        "file_analysis": {
            "description": "Analyze and extract information from uploaded files",
            "required_agents": ["file_reader", "trade_mapper"],
            "optional_agents": ["scope"],
            "confidence_threshold": 0.8
        },
        "export_existing": {
            "description": "Export existing estimate data to specified format",
            "required_agents": ["exporter"],
            "optional_agents": [],
            "confidence_threshold": 0.9
        },
        "quick_estimate": {
            "description": "Generate estimate from text description without files",
            "required_agents": ["estimator"],
            "optional_agents": ["exporter"],
            "confidence_threshold": 0.7
        },
        "scope_analysis": {
            "description": "Extract scope items from existing trade mapping",
            "required_agents": ["scope", "takeoff"],
            "optional_agents": ["estimator"],
            "confidence_threshold": 0.8
        },
        "trade_identification": {
            "description": "Identify construction trades from content",
            "required_agents": ["trade_mapper"],
            "optional_agents": ["scope"],
            "confidence_threshold": 0.8
        }
    }
    
    def __init__(self):
        self.name = "intent_classifier"
    
    def classify_intent(self, state: AppState) -> Dict[str, Any]:
        """
        Classify user intent based on query, files, and existing state data.
        Returns intent classification with confidence scores and routing recommendations.
        """
        try:
            # Gather context for classification
            context = self._gather_context(state)
            
            # Use LLM for intent classification
            classification_result = self._llm_classify_intent(context, state)
            
            # Enhance with rule-based validation
            enhanced_result = self._enhance_with_rules(classification_result, state)
            
            logger.info(f"Intent classified as: {enhanced_result.get('primary_intent')} "
                       f"(confidence: {enhanced_result.get('confidence', 0):.2f})")
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Error in intent classification: {str(e)}")
            # Fallback to rule-based classification
            return self._fallback_classification(state)
    
    def _gather_context(self, state: AppState) -> Dict[str, Any]:
        """Gather relevant context for intent classification."""
        context: Dict[str, Any] = {
            "has_query": bool(state.query and state.query.strip()),
            "query_text": state.query or "",
            "has_files": bool(state.files and len(state.files) > 0),
            "file_count": len(state.files) if state.files else 0,
            "file_types": [],
            "has_existing_data": {},
            "metadata": state.metadata or {}
        }
        
        # Analyze file types if present
        if state.files:
            for file_data in state.files:
                if hasattr(file_data, 'filename') and file_data.filename:
                    file_ext = file_data.filename.split('.')[-1].lower() if '.' in file_data.filename else 'unknown'
                    context["file_types"].append(file_ext)
        
        # Check for existing processed data
        context["has_existing_data"] = {
            "processed_files_content": bool(state.processed_files_content),
            "trade_mapping": bool(state.trade_mapping),
            "scope_items": bool(state.scope_items),
            "takeoff_data": bool(state.takeoff_data),
            "estimate": bool(state.estimate)
        }
        
        return context
    
    def _llm_classify_intent(self, context: Dict[str, Any], state: AppState) -> Dict[str, Any]:
        """Use LLM to classify user intent based on context."""
        
        # Create prompt for intent classification
        prompt = f"""
You are an expert at analyzing construction project requests to determine user intent.

CONTEXT:
- User Query: "{context.get('query_text', 'No query provided')}"
- Has Files: {context.get('has_files', False)}
- File Count: {context.get('file_count', 0)}
- File Types: {context.get('file_types', [])}
- Existing Data: {context.get('has_existing_data', {})}

POSSIBLE INTENTS:
{json.dumps(self.INTENT_DEFINITIONS, indent=2)}

TASK:
Analyze the context and classify the user's intent. Consider:
1. What the user is explicitly asking for
2. What data is already available vs. what's missing
3. The most efficient path to fulfill the request

Return a JSON response with:
{{
    "primary_intent": "intent_name",
    "confidence": 0.0-1.0,
    "reasoning": "explanation of why this intent was chosen",
    "secondary_intents": ["alternative_intent1", "alternative_intent2"],
    "recommended_sequence": ["agent1", "agent2", "agent3"],
    "skip_reasons": {{"agent_name": "reason_to_skip"}}
}}

Focus on efficiency - if data already exists that can fulfill the request, recommend skipping redundant processing steps.
"""
        
        try:
            response = run_llm(
                prompt=prompt,
                model=state.llm_config.model if state.llm_config else "gpt-4o",
                api_key=state.llm_config.api_key if state.llm_config else None,
                agent_name=self.name
            )
            
            # Parse JSON response
            result = json.loads(response)
            
            # Validate the response structure
            if not all(key in result for key in ["primary_intent", "confidence", "reasoning"]):
                raise ValueError("Invalid LLM response structure")
            
            return result
            
        except Exception as e:
            logger.error(f"LLM intent classification failed: {str(e)}")
            raise
    
    def _enhance_with_rules(self, llm_result: Dict[str, Any], state: AppState) -> Dict[str, Any]:
        """Enhance LLM classification with rule-based validation and adjustments."""
        
        primary_intent = llm_result.get("primary_intent")
        confidence = llm_result.get("confidence", 0)
        
        # Rule-based adjustments
        adjusted_result = llm_result.copy()
        
        # Rule 1: If estimate exists and export keywords in query, force export intent
        if (state.estimate and state.query and 
            any(keyword in state.query.lower() for keyword in ["export", "download", "save", "format"])):
            adjusted_result.update({
                "primary_intent": "export_existing",
                "confidence": max(confidence, 0.85),
                "rule_applied": "export_existing_data_rule"
            })
        
        # Rule 2: If no files and no existing data, limit to query-based operations
        elif not state.files and not any(state.processed_files_content or {}):
            if primary_intent in ["full_estimation", "file_analysis"]:
                adjusted_result.update({
                    "primary_intent": "quick_estimate",
                    "confidence": max(confidence, 0.7),
                    "rule_applied": "no_files_fallback_rule"
                })
        
        # Rule 3: If files exist but user asks for specific partial processing
        elif (state.files and state.query and 
              any(keyword in state.query.lower() for keyword in ["trade", "mapping", "identify"])):
            if primary_intent == "full_estimation":
                adjusted_result.update({
                    "primary_intent": "trade_identification",
                    "confidence": max(confidence, 0.8),
                    "rule_applied": "partial_processing_rule"
                })
        
        # Rule 4: Confidence boost for clear patterns
        query_lower = (state.query or "").lower()
        if any(keyword in query_lower for keyword in ["estimate", "cost", "pricing"]):
            if primary_intent in ["full_estimation", "quick_estimate"]:
                adjusted_result["confidence"] = min(adjusted_result["confidence"] + 0.1, 1.0)
        
        return adjusted_result
    
    def _fallback_classification(self, state: AppState) -> Dict[str, Any]:
        """Fallback rule-based classification when LLM fails."""
        logger.warning("Using fallback rule-based intent classification")
        
        # Simple rule-based classification
        if state.estimate and state.query and "export" in state.query.lower():
            return {
                "primary_intent": "export_existing",
                "confidence": 0.8,
                "reasoning": "Fallback: Export keywords detected with existing estimate",
                "recommended_sequence": ["exporter"],
                "fallback_used": True
            }
        elif state.files and len(state.files) > 0:
            return {
                "primary_intent": "full_estimation",
                "confidence": 0.7,
                "reasoning": "Fallback: Files present, assuming full estimation needed",
                "recommended_sequence": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"],
                "fallback_used": True
            }
        else:
            return {
                "primary_intent": "quick_estimate",
                "confidence": 0.6,
                "reasoning": "Fallback: No clear indicators, defaulting to quick estimate",
                "recommended_sequence": ["estimator"],
                "fallback_used": True
            }
    
    def get_agent_sequence_for_intent(self, intent: str, context: Optional[Dict[str, Any]] = None) -> List[str]:
        """Get the recommended agent sequence for a given intent."""
        if intent not in self.INTENT_DEFINITIONS:
            logger.warning(f"Unknown intent: {intent}, using full pipeline")
            return ["file_reader", "trade_mapper", "scope", "takeoff", "estimator", "exporter"]
        
        intent_def = self.INTENT_DEFINITIONS[intent]
        sequence = intent_def["required_agents"].copy()
        
        # Add optional agents based on context or user preferences
        if context and context.get("include_optional", True):
            sequence.extend(intent_def["optional_agents"])
        
        return sequence

# Create singleton instance
intent_classifier = IntentClassifier()
