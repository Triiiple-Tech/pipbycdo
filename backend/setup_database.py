#!/usr/bin/env python3
"""
Database setup script for PIP AI
Creates required tables in Supabase database
"""

import sys
import os

# Add parent directory to path and load environment variables
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    import load_env  # Side effect import: loads environment variables from root .env
    # Ensure load_env is recognized as used
    _ = load_env
except ImportError:
    print("Warning: Could not import load_env - environment variables may not be loaded")

from services.supabase_client import get_supabase_client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Create required database tables if they don't exist"""
    try:
        client = get_supabase_client()
        logger.info("Connected to Supabase successfully")
        
        # Define table creation SQL statements
        tables = {
            "tasks": """
                CREATE TABLE IF NOT EXISTS tasks (
                    id UUID PRIMARY KEY,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    result JSONB,
                    error TEXT,
                    initial_payload JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """,
            "prompt_templates": """
                CREATE TABLE IF NOT EXISTS prompt_templates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    label VARCHAR(100) NOT NULL,
                    prompt TEXT NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    icon VARCHAR(50) NOT NULL,
                    description TEXT,
                    is_admin BOOLEAN DEFAULT FALSE,
                    tags TEXT[],
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """,
            "audit_logs": """
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    user_id VARCHAR(100),
                    user_email VARCHAR(255),
                    agent VARCHAR(100) NOT NULL,
                    event_type VARCHAR(50) NOT NULL,
                    event_details TEXT NOT NULL,
                    model_used VARCHAR(100),
                    session_id VARCHAR(100),
                    task_id VARCHAR(100),
                    cost_estimate DECIMAL(10,6),
                    duration_ms INTEGER,
                    level VARCHAR(20) DEFAULT 'info',
                    error TEXT,
                    ip_address INET,
                    user_agent TEXT
                );
            """
        }
        
        # Create each table
        for table_name, sql in tables.items():
            try:
                logger.info(f"Creating table: {table_name}")
                # Execute raw SQL using Supabase RPC
                client.rpc('execute_sql', {'sql': sql}).execute()
                logger.info(f"✅ Table {table_name} created successfully")
            except Exception as e:
                # If RPC doesn't work, try creating a simple record to test table existence
                try:
                    if table_name == "tasks":
                        # Test if tasks table exists by trying to select from it
                        client.table("tasks").select("id").limit(1).execute()
                        logger.info(f"✅ Table {table_name} already exists")
                    elif table_name == "prompt_templates":
                        client.table("prompt_templates").select("id").limit(1).execute()
                        logger.info(f"✅ Table {table_name} already exists")
                    elif table_name == "audit_logs":
                        client.table("audit_logs").select("id").limit(1).execute()
                        logger.info(f"✅ Table {table_name} already exists")
                except Exception as table_error:
                    logger.error(f"❌ Table {table_name} does not exist and could not be created: {table_error}")
                    logger.info(f"SQL for {table_name}:\n{sql}")
        
        logger.info("Database setup completed")
        return True
        
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        return False

def test_database_connectivity():
    """Test basic database connectivity and table access"""
    try:
        client = get_supabase_client()
        logger.info("Testing database connectivity...")
        
        # Test tasks table
        try:
            client.table("tasks").select("count").execute()
            logger.info("✅ Tasks table accessible")
        except Exception as e:
            logger.warning(f"❌ Tasks table not accessible: {e}")
        
        # Test prompt_templates table
        try:
            client.table("prompt_templates").select("count").execute()
            logger.info("✅ Prompt templates table accessible")
        except Exception as e:
            logger.warning(f"❌ Prompt templates table not accessible: {e}")
        
        # Test audit_logs table
        try:
            client.table("audit_logs").select("count").execute()
            logger.info("✅ Audit logs table accessible")
        except Exception as e:
            logger.warning(f"❌ Audit logs table not accessible: {e}")
            
        return True
        
    except Exception as e:
        logger.error(f"Database connectivity test failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting PIP AI database setup...")
    
    # Test connectivity first
    if test_database_connectivity():
        logger.info("Database connectivity test passed")
    else:
        logger.error("Database connectivity test failed")
        sys.exit(1)
    
    # Try to create tables
    if create_tables():
        logger.info("Database setup completed successfully")
        
        # Final connectivity test
        test_database_connectivity()
    else:
        logger.error("Database setup failed")
        sys.exit(1)
