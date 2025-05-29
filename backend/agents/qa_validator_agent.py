from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_interaction(state: AppState, decision: str, message: str, level: str = "info"):
    """Helper function to log agent interactions consistently."""
    timestamp = datetime.now(timezone.utc)
    
    state.agent_trace.append(AgentTraceEntry(
        agent="qa_validator",
        decision=decision,
        timestamp=timestamp,
        level=level if level == "error" else None,
        error=message if level == "error" else None
    ))
    
    state.meeting_log.append(MeetingLogEntry(
        agent="qa_validator",
        message=message,
        timestamp=timestamp
    ))

    if level == "error":
        logger.error(f"QA Validator Agent: {message} - Decision: {decision}")
    else:
        logger.info(f"QA Validator Agent: {message} - Decision: {decision}")
    state.updated_at = timestamp

def handle(state_dict: dict) -> dict:
    state = AppState(**state_dict)
    log_interaction(state, "Starting QA validation", "QA Validator Agent invoked.")

    # Placeholder for QA/Validation logic
    # This agent would typically review outputs from other agents
    # (e.g., state.estimate, state.takeoff_data, state.scope_items)
    # and populate a field like state.qa_findings or similar.

    if not state.estimate and not state.takeoff_data and not state.scope_items:
        log_interaction(state, "No data to validate", "No outputs from prior agents found for QA.", level="warning")
        state.qa_findings = [] # Or some other appropriate default
        log_interaction(state, "QA validation skipped", "QA Validator Agent finished due to no input.")
        return state.model_dump()

    # Example: Simple check on estimate items
    qa_findings: List[Dict[str, Any]] = []
    if state.estimate:
        for item in state.estimate:
            if item.total is None or item.total < 0:
                qa_findings.append({
                    "item_id": item.item,
                    "finding_type": "Invalid Estimate Total",
                    "message": f"Estimate item '{item.description}' has an invalid total: {item.total}.",
                    "severity": "error"
                })
            if not item.csi_division or item.csi_division == "000000" or item.csi_division == "ERROR":
                 qa_findings.append({
                    "item_id": item.item,
                    "finding_type": "Missing/Invalid CSI Division",
                    "message": f"Estimate item '{item.description}' has a missing or invalid CSI division: {item.csi_division}.",
                    "severity": "warning"
                })


    state.qa_findings = qa_findings
    
    if qa_findings:
        log_interaction(state, f"QA validation complete. Found {len(qa_findings)} issues.", f"QA Validator Agent finished. Identified {len(qa_findings)} potential issues.")
    else:
        log_interaction(state, "QA validation complete. No issues found.", "QA Validator Agent finished. All checked items passed QA.")
        
    return state.model_dump()
