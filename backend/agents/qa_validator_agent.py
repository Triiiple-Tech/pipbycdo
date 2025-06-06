from backend.agents.base_agent import BaseAgent
from backend.app.schemas import AppState
import logging
import json
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class QAValidatorAgent(BaseAgent):
    """
    Agent responsible for quality assurance and validation of outputs from other agents.
    Uses LLM to perform intelligent validation and identify potential issues.
    """
    
    def __init__(self):
        super().__init__("qa_validator")
    
    def process(self, state: AppState) -> AppState:
        """Perform quality assurance validation on agent outputs."""
        self.log_interaction(state, "Starting QA validation", 
                           "QA Validator Agent analyzing outputs from previous agents")
        
        # Check if there's any data to validate
        if not self._has_data_to_validate(state):
            self.log_interaction(state, "No data to validate", 
                               "No outputs from prior agents found for QA", level="error")
            state.qa_findings = []
            return state
        
        # Initialize findings list
        qa_findings: List[Dict[str, Any]] = []
        
        # Perform comprehensive validation
        qa_findings.extend(self._validate_estimate_data(state))
        qa_findings.extend(self._validate_takeoff_data(state))
        qa_findings.extend(self._validate_scope_items(state))
        qa_findings.extend(self._validate_file_processing(state))
        
        # Try LLM-enhanced validation for deeper analysis
        llm_findings = self._llm_enhanced_validation(state)
        if llm_findings:
            qa_findings.extend(llm_findings)
        
        # Store results
        state.qa_findings = qa_findings
        
        # Log completion
        error_count = len([f for f in qa_findings if f.get('severity') == 'error'])
        warning_count = len([f for f in qa_findings if f.get('severity') == 'warning'])
        
        if qa_findings:
            self.log_interaction(state, f"QA validation complete - found {len(qa_findings)} issues", 
                               f"Identified {error_count} errors and {warning_count} warnings")
        else:
            self.log_interaction(state, "QA validation complete - no issues found", 
                               "All checked items passed QA validation")
        
        return state
    
    def _has_data_to_validate(self, state: AppState) -> bool:
        """Check if there's any data available for validation."""
        return bool(state.estimate or state.takeoff_data or state.scope_items or state.processed_files_content)
    
    def _validate_estimate_data(self, state: AppState) -> List[Dict[str, Any]]:
        """Validate estimate data for common issues."""
        findings: List[Dict[str, Any]] = []
        
        if not state.estimate:
            return findings
        
        for item in state.estimate:
            # Check for invalid totals - since total is float, check for negative values only
            if item.total < 0:
                findings.append({
                    "item_id": item.item,
                    "finding_type": "Invalid Estimate Total",
                    "message": f"Estimate item '{item.description}' has an invalid total: {item.total}",
                    "severity": "error",
                    "agent_source": "estimator"
                })
            
            # Check for missing/invalid CSI division
            if not item.csi_division or item.csi_division == "000000" or item.csi_division == "ERROR":
                findings.append({
                    "item_id": item.item,
                    "finding_type": "Missing/Invalid CSI Division",
                    "message": f"Estimate item '{item.description}' has missing or invalid CSI division: {item.csi_division}",
                    "severity": "warning",
                    "agent_source": "trade_mapper"
                })
            
            # Check for zero quantities or unit prices
            if item.qty == 0:
                findings.append({
                    "item_id": item.item,
                    "finding_type": "Zero Quantity",
                    "message": f"Estimate item '{item.description}' has zero quantity",
                    "severity": "warning",
                    "agent_source": "takeoff"
                })
            
            if item.unit_price == 0:
                findings.append({
                    "item_id": item.item,
                    "finding_type": "Zero Unit Price",
                    "message": f"Estimate item '{item.description}' has zero unit price",
                    "severity": "warning",
                    "agent_source": "estimator"
                })
            
            # Check for missing descriptions
            if not item.description or item.description.strip() == "":
                findings.append({
                    "item_id": item.item,
                    "finding_type": "Missing Description",
                    "message": f"Estimate item {item.item} is missing a description",
                    "severity": "warning",
                    "agent_source": "scope"
                })
        
        return findings
    
    def _validate_takeoff_data(self, state: AppState) -> List[Dict[str, Any]]:
        """Validate takeoff data for common issues."""
        findings: List[Dict[str, Any]] = []
        
        if not state.takeoff_data:
            return findings
        
        for item in state.takeoff_data:
            item_id = item.get("scope_item_id", "UNKNOWN")
            
            # Check for error items
            if item.get("error_message"):
                findings.append({
                    "item_id": item_id,
                    "finding_type": "Takeoff Processing Error",
                    "message": f"Takeoff item failed processing: {item.get('error_message')}",
                    "severity": "error",
                    "agent_source": "takeoff"
                })
            
            # Check for missing units
            if not item.get("unit") or item.get("unit") == "N/A":
                findings.append({
                    "item_id": item_id,
                    "finding_type": "Missing Unit",
                    "message": f"Takeoff item '{item.get('description')}' is missing unit of measurement",
                    "severity": "warning",
                    "agent_source": "takeoff"
                })
            
            # Check for unusual quantities
            quantity = item.get("quantity", 0)
            if quantity > 10000:  # Flag very large quantities
                findings.append({
                    "item_id": item_id,
                    "finding_type": "Unusually Large Quantity",
                    "message": f"Takeoff item has very large quantity: {quantity} {item.get('unit')}",
                    "severity": "warning",
                    "agent_source": "takeoff"
                })
        
        return findings
    
    def _validate_scope_items(self, state: AppState) -> List[Dict[str, Any]]:
        """Validate scope items for common issues."""
        findings: List[Dict[str, Any]] = []
        
        if not state.scope_items:
            return findings
        
        for item in state.scope_items:
            item_id = item.get("item_id", "UNKNOWN")
            
            # Check for error items
            if item.get("error_message"):
                findings.append({
                    "item_id": item_id,
                    "finding_type": "Scope Processing Error",
                    "message": f"Scope item failed processing: {item.get('error_message')}",
                    "severity": "error",
                    "agent_source": "scope"
                })
            
            # Check for very short descriptions
            description = item.get("description", "")
            if len(description) < 10:
                findings.append({
                    "item_id": item_id,
                    "finding_type": "Very Short Description",
                    "message": f"Scope item has very short description: '{description}'",
                    "severity": "warning",
                    "agent_source": "scope"
                })
        
        return findings
    
    def _validate_file_processing(self, state: AppState) -> List[Dict[str, Any]]:
        """Validate file processing results."""
        findings: List[Dict[str, Any]] = []
        
        if not state.processed_files_content:
            return findings
        
        # Check for files that failed to process
        for filename, content in state.processed_files_content.items():
            if not content or content.strip() == "":
                findings.append({
                    "item_id": filename,
                    "finding_type": "Empty File Content",
                    "message": f"File '{filename}' was processed but contains no content",
                    "severity": "warning",
                    "agent_source": "file_reader"
                })
        
        return findings
    
    def _llm_enhanced_validation(self, state: AppState) -> Optional[List[Dict[str, Any]]]:
        """Use LLM to perform enhanced validation and identify subtle issues."""
        if not state.llm_config or not state.llm_config.api_key:
            self.log_interaction(state, "LLM not available for enhanced validation", 
                               "No LLM config available, using basic validation only")
            return None
        
        # Prepare data summary for LLM analysis
        data_summary = {
            "estimate_count": len(state.estimate) if state.estimate else 0,
            "takeoff_count": len(state.takeoff_data) if state.takeoff_data else 0,
            "scope_count": len(state.scope_items) if state.scope_items else 0,
            "files_processed": len(state.processed_files_content) if state.processed_files_content else 0
        }
        
        # Sample some data for analysis (avoid sending too much data)
        sample_data = {}
        if state.estimate and len(state.estimate) > 0:
            sample_data["sample_estimate"] = [item.model_dump() for item in state.estimate[:3]]
        if state.takeoff_data and len(state.takeoff_data) > 0:
            sample_data["sample_takeoff"] = state.takeoff_data[:3]
        if state.scope_items and len(state.scope_items) > 0:
            sample_data["sample_scope"] = state.scope_items[:3]
        
        system_prompt = """You are a construction industry QA specialist. Analyze the provided data for potential issues, inconsistencies, or areas of concern.

Look for:
1. Inconsistencies between scope items, takeoffs, and estimates
2. Unusual patterns in quantities, units, or pricing
3. Missing or incomplete data relationships
4. Industry-specific issues or red flags

Return a JSON array of findings with this structure:
[
    {
        "finding_type": "<type_of_issue>",
        "message": "<detailed_description>",
        "severity": "<error|warning|info>",
        "item_id": "<relevant_item_id_if_applicable>",
        "recommendation": "<suggested_action>"
    }
]

Only return findings that represent actual issues. Return an empty array if no issues are found."""
        
        user_prompt = f"""Analyze this construction project data for QA issues:

Data Summary:
- Estimate items: {data_summary['estimate_count']}
- Takeoff items: {data_summary['takeoff_count']}
- Scope items: {data_summary['scope_count']}
- Files processed: {data_summary['files_processed']}

Sample Data:
{json.dumps(sample_data, indent=2)}

Identify any QA issues in the requested JSON format."""
        
        try:
            response = self.call_llm(state, user_prompt, system_prompt)
            if not response:
                return None
            
            # Parse JSON response
            try:
                llm_findings = json.loads(response.strip())
                
                # Validate the response format
                if not isinstance(llm_findings, list):
                    self.log_interaction(state, "Invalid LLM QA response format", 
                                       "LLM response is not a list")
                    return None
                
                # Add source information to findings
                for finding in llm_findings:  # type: ignore
                    if isinstance(finding, dict):
                        finding["agent_source"] = "qa_validator_llm"
                        # Ensure required fields exist
                        if "severity" not in finding:
                            finding["severity"] = "warning"
                        if "item_id" not in finding:
                            finding["item_id"] = "GENERAL"
                
                self.log_interaction(state, f"LLM QA analysis successful", 
                                   f"LLM identified {len(llm_findings)} additional issues")  # type: ignore
                return llm_findings  # type: ignore
                
            except json.JSONDecodeError as e:
                self.log_interaction(state, "LLM QA JSON parse error", 
                                   f"Failed to parse LLM response as JSON: {str(e)}")
                return None
                
        except Exception as e:
            self.log_interaction(state, "LLM QA validation error", 
                               f"Error during LLM QA analysis: {str(e)}")
            return None


# Create singleton instance
qa_validator_agent = QAValidatorAgent()

# Backward compatibility function
def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy handle function for backward compatibility."""
    return qa_validator_agent.handle(state_dict)
