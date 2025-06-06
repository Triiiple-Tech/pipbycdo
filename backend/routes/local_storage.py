"""
Local storage module to provide fallback when Supabase is unavailable.
This module maintains in-memory storage for tasks, templates, and audit logs
when database operations fail.
"""
import os
import json
import time
from typing import Dict, List, Any, Optional
import threading
import logging

logger = logging.getLogger(__name__)

# In-memory storage with proper typing
_local_storage: Dict[str, Dict[str, Any]] = {
    "tasks": {},
    "prompt_templates": {},
    "audit_logs": {},
}

# Local storage file paths
_storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "local_storage")
_tasks_file = os.path.join(_storage_dir, "tasks.json")
_templates_file = os.path.join(_storage_dir, "templates.json")
_audit_logs_file = os.path.join(_storage_dir, "audit_logs.json")

# Lock for thread safety
_storage_lock = threading.RLock()

def _ensure_storage_dir():
    """Ensure the local storage directory exists."""
    os.makedirs(_storage_dir, exist_ok=True)

def _load_local_storage():
    """Load data from local storage files into memory."""
    _ensure_storage_dir()
    
    try:
        if os.path.exists(_tasks_file):
            with open(_tasks_file, 'r') as f:
                _local_storage["tasks"] = json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load tasks from local storage: {e}")
    
    try:
        if os.path.exists(_templates_file):
            with open(_templates_file, 'r') as f:
                _local_storage["prompt_templates"] = json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load templates from local storage: {e}")
    
    try:
        if os.path.exists(_audit_logs_file):
            with open(_audit_logs_file, 'r') as f:
                _local_storage["audit_logs"] = json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load audit logs from local storage: {e}")

def _save_local_storage(storage_type: str):
    """Save in-memory storage to local files."""
    _ensure_storage_dir()
    
    try:
        file_path = {
            "tasks": _tasks_file,
            "prompt_templates": _templates_file,
            "audit_logs": _audit_logs_file
        }.get(storage_type)
        
        if file_path:
            with open(file_path, 'w') as f:
                json.dump(_local_storage[storage_type], f, default=str)
    except Exception as e:
        logger.warning(f"Failed to save {storage_type} to local storage: {e}")

# Load storage on module import
_load_local_storage()

def store_task_locally(task_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
    """Store a task in local storage."""
    with _storage_lock:
        _local_storage["tasks"][task_id] = task_data
        _save_local_storage("tasks")
    logger.info(f"Task {task_id} stored locally")
    return task_data

def update_task_locally(task_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a task in local storage."""
    with _storage_lock:
        if task_id in _local_storage["tasks"]:
            _local_storage["tasks"][task_id].update(update_data)
            _save_local_storage("tasks")
            logger.info(f"Task {task_id} updated locally")
            return _local_storage["tasks"][task_id]
        else:
            logger.warning(f"Task {task_id} not found in local storage")
            return None

def get_task_locally(task_id: str) -> Optional[Dict[str, Any]]:
    """Get a task from local storage."""
    with _storage_lock:
        task = _local_storage["tasks"].get(task_id)
    if task:
        logger.info(f"Task {task_id} retrieved from local storage")
    else:
        logger.warning(f"Task {task_id} not found in local storage")
    return task

def store_template_locally(template_id: str, template_data: Dict[str, Any]) -> Dict[str, Any]:
    """Store a template in local storage."""
    with _storage_lock:
        _local_storage["prompt_templates"][template_id] = template_data
        _save_local_storage("prompt_templates")
    logger.info(f"Template {template_id} stored locally")
    return template_data

def get_templates_locally() -> List[Dict[str, Any]]:
    """Get all templates from local storage."""
    with _storage_lock:
        templates = list(_local_storage["prompt_templates"].values())
    logger.info(f"Retrieved {len(templates)} templates from local storage")
    return templates

def update_template_locally(template_id: str, template_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a template in local storage."""
    with _storage_lock:
        if template_id in _local_storage["prompt_templates"]:
            _local_storage["prompt_templates"][template_id].update(template_data)
            _save_local_storage("prompt_templates")
            logger.info(f"Template {template_id} updated locally")
            return _local_storage["prompt_templates"][template_id]
        else:
            logger.warning(f"Template {template_id} not found in local storage")
            return None

def delete_template_locally(template_id: str) -> Optional[Dict[str, str]]:
    """Delete a template from local storage."""
    with _storage_lock:
        if template_id in _local_storage["prompt_templates"]:
            _local_storage["prompt_templates"].pop(template_id)
            _save_local_storage("prompt_templates")
            logger.info(f"Template {template_id} deleted from local storage")
            return {"id": template_id, "message": "Template deleted successfully"}
        else:
            logger.warning(f"Template {template_id} not found in local storage")
            return None

def store_audit_log_locally(log_data: Dict[str, Any]) -> Dict[str, Any]:
    """Store an audit log entry in local storage."""
    log_id = log_data.get("id", f"log-{int(time.time())}")
    with _storage_lock:
        _local_storage["audit_logs"][log_id] = log_data
        _save_local_storage("audit_logs")
    logger.info(f"Audit log {log_id} stored locally")
    return log_data

def get_audit_logs_locally() -> List[Dict[str, Any]]:
    """Get all audit logs from local storage."""
    with _storage_lock:
        logs = list(_local_storage["audit_logs"].values())
    logger.info(f"Retrieved {len(logs)} audit logs from local storage")
    return logs
