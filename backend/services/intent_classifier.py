"""
Intent Classification Service for PIP AI Autonomous Agentic Manager Protocol

This service detects and logs intent from user input and determines the required
agent sequence based on the available data and user requirements.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import re
import logging
from enum import Enum

from backend.app.schemas import AppState, AgentTraceEntry
from backend.services.gpt_handler import run_llm

logger = logging.getLogger(__name__)

class IntentType(Enum):
    """Supported intent types for the autonomous agentic workflow"""
    FILE_ANALYSIS = "file_analysis"
    SMARTSHEET_INTEGRATION = "smartsheet_integration"
    FULL_ESTIMATION = "full_estimation"
    TRADE_SPECIFIC_ANALYSIS = "trade_specific_analysis"
    EXPORT_ONLY = "export_only"
    RERUN_AGENT = "rerun_agent"
    QUALITY_REVIEW = "quality_review"
    UNKNOWN = "unknown"

class IntentClassifier:
    """
    Advanced intent classification system that detects user intent and determines
    the optimal agent workflow sequence.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.IntentClassifier")
        
        # Intent detection patterns
        self.intent_patterns = {
            IntentType.SMARTSHEET_INTEGRATION: [
                r"smartsheet",
                r"sheet\s*(?:url|link)",
                r"app\.smartsheet\.com",
                r"push\s+(?:to|back)\s+smartsheet",
                r"sync\s+(?:with|to)\s+smartsheet"
            ],
            IntentType.FULL_ESTIMATION: [
                r"estimate.*project",
                r"full\s+estimation",
                r"complete\s+analysis",
                r"complete.*analysis.*needed",
                r"analyze.*plans?",
                r"cost\s+estimate",
                r"takeoff.*estimate",
                r"construction.*project",
                r"renovation.*project", 
                r"commercial.*renovation",
                r"office.*renovation",
                r"building.*renovation",
                r"urgent.*analysis",
                r"scope.*of.*work",
                r"electrical.*systems",
                r"hvac.*systems",
                r"plumbing.*work",
                r"general.*construction",
                r"deliverables.*required",
                r"autonomous.*workflow",
                r"brain.*allocation",
                r"project.*details"
            ],
            IntentType.FILE_ANALYSIS: [
                r"analyze.*files?",
                r"extract.*(?:text|content)",
                r"read.*(?:pdf|document)",
                r"process.*files?"
            ],
            IntentType.TRADE_SPECIFIC_ANALYSIS: [
                r"(?:electrical|plumbing|hvac|mechanical|structural)",
                r"trade\s+specific",
                r"focus\s+on.*trade",
                r"only.*(?:electrical|plumbing|hvac)"
            ],
            IntentType.EXPORT_ONLY: [
                r"export.*(?:xlsx|pdf|csv|json)",
                r"download.*estimate",
                r"generate.*report",
                r"create.*spreadsheet"
            ],
            IntentType.RERUN_AGENT: [
                r"re-?run",
                r"try\s+again",
                r"restart.*agent",
                r"rewind"
            ],
            IntentType.QUALITY_REVIEW: [
                r"review.*quality",
                r"qa\s+check",
                r"validate.*estimate",
                r"check.*accuracy"
            ]
        }
    
    async def classify_intent(self, state: AppState) -> Tuple[IntentType, Dict[str, Any]]:
        """
        Classify user intent based on query, files, and context.
        
        Returns:
            Tuple of (IntentType, metadata dict with additional context)
        """
        try:
            # Extract analysis inputs
            query = state.query or ""
            files_count = len(state.files) if state.files else 0
            has_smartsheet_url = bool(self._extract_smartsheet_url(query))
            is_file_selection = self._is_file_selection_input(query)
            metadata = state.metadata or {}
            
            # Debug logging
            logger.info(f"INTENT DEBUG: query='{query[:100]}...', files_count={files_count}, has_smartsheet_url={has_smartsheet_url}, is_file_selection={is_file_selection}")
            
            # Check for file selection continuation (should go back to Smartsheet)
            if is_file_selection:
                intent_metadata = {
                    "confidence": 0.95,
                    "pattern_match": True,
                    "llm_classified": False,
                    "file_selection": True,
                    "classified_at": datetime.now(timezone.utc).isoformat()
                }
                logger.info("INTENT DEBUG: File selection detected, returning SMARTSHEET_INTEGRATION")
                final_intent = IntentType.SMARTSHEET_INTEGRATION
                self._log_classification(state, final_intent, intent_metadata)
                return final_intent, intent_metadata
            
            # Pattern-based classification
            pattern_intent = self._classify_by_patterns(query)
            
            # LLM-enhanced classification for complex cases
            llm_intent = await self._classify_with_llm(state)
            
            # Combine results with priority logic
            final_intent, confidence = self._combine_classifications(
                pattern_intent, llm_intent, has_smartsheet_url, files_count
            )
            
            # Extract additional metadata
            intent_metadata = {
                "confidence": confidence,
                "pattern_match": pattern_intent != IntentType.UNKNOWN,
                "llm_classified": llm_intent != IntentType.UNKNOWN,
                "smartsheet_url": self._extract_smartsheet_url(query),
                "trade_focus": self._extract_trade_focus(query),
                "export_format": self._extract_export_format(query),
                "files_detected": files_count,
                "classified_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Log the classification result
            self._log_classification(state, final_intent, intent_metadata)
            
            return final_intent, intent_metadata
            
        except Exception as e:
            self.logger.error(f"Intent classification failed: {str(e)}")
            return IntentType.UNKNOWN, {"error": str(e)}
    
    def _classify_by_patterns(self, query: str) -> IntentType:
        """Classify intent using regex patterns"""
        query_lower = query.lower()
        
        for intent_type, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    return intent_type
        
        return IntentType.UNKNOWN
    
    async def _classify_with_llm(self, state: AppState) -> IntentType:
        """Use LLM for sophisticated intent classification"""
        try:
            prompt = f"""
            Classify the user's intent for a construction document analysis system.
            
            User Query: "{state.query}"
            Files Uploaded: {len(state.files) if state.files else 0}
            Context: {state.metadata}
            
            Available Intent Types:
            - file_analysis: User wants to analyze uploaded files
            - smartsheet_integration: User wants to work with Smartsheet data
            - full_estimation: User wants a complete cost estimation workflow
            - trade_specific_analysis: User wants analysis for specific trades
            - export_only: User only wants to export existing data
            - rerun_agent: User wants to re-run a previous step
            - quality_review: User wants quality assurance review
            - unknown: Intent is unclear
            
            Respond with ONLY the intent type (e.g., "full_estimation").
            """
            
            # Use specific model for intent classification
            response = await run_llm(
                prompt=prompt,
                model="gpt-4o-mini",
                api_key=None,  # Will use default
                agent_name="intent_classifier",
                temperature=0.1,
                max_tokens=50
            )
            
            # Parse LLM response
            intent_str = response.strip().lower()
            for intent_type in IntentType:
                if intent_type.value == intent_str:
                    return intent_type
            
            return IntentType.UNKNOWN
            
        except Exception as e:
            self.logger.error(f"LLM intent classification failed: {str(e)}")
            return IntentType.UNKNOWN
    
    def _combine_classifications(
        self, 
        pattern_intent: IntentType, 
        llm_intent: IntentType, 
        has_smartsheet_url: bool,
        files_count: int
    ) -> Tuple[IntentType, float]:
        """Combine pattern and LLM classifications with confidence scoring"""
        
        # High confidence scenarios
        if pattern_intent == llm_intent and pattern_intent != IntentType.UNKNOWN:
            return pattern_intent, 0.95
        
        # Smartsheet URL detected - high confidence for smartsheet integration
        if has_smartsheet_url:
            logger.info(f"INTENT DEBUG: Smartsheet URL detected, returning SMARTSHEET_INTEGRATION")
            return IntentType.SMARTSHEET_INTEGRATION, 0.90
        
        # Files uploaded without specific intent - default to full estimation
        if files_count > 0 and pattern_intent == IntentType.UNKNOWN and llm_intent == IntentType.UNKNOWN:
            return IntentType.FULL_ESTIMATION, 0.75
        
        # Pattern match has priority over LLM for specific patterns
        if pattern_intent != IntentType.UNKNOWN:
            return pattern_intent, 0.80
        
        # LLM classification as fallback
        if llm_intent != IntentType.UNKNOWN:
            return llm_intent, 0.70
        
        # Default to unknown with low confidence
        return IntentType.UNKNOWN, 0.10
    
    def _extract_smartsheet_url(self, query: str) -> Optional[str]:
        """Extract Smartsheet URL from query"""
        smartsheet_pattern = r'https?://app\.smartsheet\.com/[^\s]+'
        match = re.search(smartsheet_pattern, query)
        result = match.group(0) if match else None
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"_extract_smartsheet_url: query='{query[:100]}...', pattern='{smartsheet_pattern}', result='{result}'")
        return result
    
    def _extract_trade_focus(self, query: str) -> Optional[str]:
        """Extract specific trade focus from query"""
        trades = ["electrical", "plumbing", "hvac", "mechanical", "structural", "demo", "demolition"]
        query_lower = query.lower()
        
        for trade in trades:
            if trade in query_lower:
                return trade.title()
        
        return None
    
    def _extract_export_format(self, query: str) -> Optional[str]:
        """Extract desired export format from query"""
        formats = ["xlsx", "pdf", "csv", "json"]
        query_lower = query.lower()
        
        for fmt in formats:
            if fmt in query_lower:
                return fmt.upper()
        
        return None
    
    def _log_classification(self, state: AppState, intent: IntentType, metadata: Dict[str, Any]):
        """Log the classification result to agent trace"""
        trace_entry = AgentTraceEntry(
            agent="intent_classifier",
            decision=f"Classified intent as {intent.value}",
            model="gpt-4o-mini",
            level="info",
            timestamp=datetime.now(timezone.utc)
        )
        
        if hasattr(state, 'agent_trace') and state.agent_trace is not None:
            state.agent_trace.append(trace_entry)
        
        self.logger.info(f"Intent classified: {intent.value} (confidence: {metadata.get('confidence', 0)})")

    def get_agent_sequence_for_intent(self, intent: str) -> List[str]:
        """
        Get the recommended agent sequence for a given intent.
        
        Args:
            intent: Intent type (e.g., "full_estimation", "export_only")
            
        Returns:
            List of agent names in recommended execution order
        """
        sequences = {
            "full_estimation": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"],
            "file_analysis": ["file_reader", "trade_mapper"],
            "smartsheet_integration": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator", "smartsheet"],
            "trade_specific_analysis": ["file_reader", "trade_mapper", "scope"],
            "export_only": ["exporter"],
            "rerun_agent": [],  # Determined by specific rerun request
            "quality_review": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"],
            "unknown": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"]
        }
        
        return sequences.get(intent, sequences["unknown"])

    @property 
    def name(self) -> str:
        """Name property for compatibility with tests"""
        return "intent_classifier"

    @property
    def INTENT_DEFINITIONS(self) -> Dict[str, str]:
        """Intent definitions for compatibility with tests"""
        return {
            "full_estimation": "Complete cost estimation workflow from files to final estimate",
            "export_existing": "Export existing data without additional processing",
            "file_analysis": "Analyze uploaded files for content extraction",
            "smartsheet_integration": "Integrate with Smartsheet for data sync",
            "trade_specific_analysis": "Focus on specific construction trades",
            "rerun_agent": "Re-run a previous agent step",
            "quality_review": "Review and validate existing estimates"
        }

    def _is_file_selection_input(self, query: str) -> bool:
        """Detect if the query is a file selection input."""
        file_selection_patterns = [
            r'selected_files:\s*',
            r'analyze\s+(selected|files|all)',
            r'file\s*\d+',
            r'\.(pdf|xlsx?|docx?|txt)',
            r'select.*file',
            r'files?:\s*\[',
        ]
        
        import re
        for pattern in file_selection_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return True
        return False

# Global instance
intent_classifier = IntentClassifier()
