# pipbycdo/backend/tests/test_api.py
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from typing import Optional
import os

# Mock classes for Supabase
class MockSupabaseClient:
    def table(self, table_name):
        return MockTable()

class MockTable:
    def insert(self, data):
        return MockQuery()
    def select(self, *args):
        return MockQuery()
    def update(self, data):
        return MockQuery()
    def delete(self):
        return MockQuery()

class MockQuery:
    def execute(self):
        return MockResponse()
    def eq(self, column, value):
        return self
    def single(self):
        return self

class MockResponse:
    def __init__(self):
        self.data = []
        self.error = None

# Create a shared mock instance
mock_supabase_client = MockSupabaseClient()

def mock_get_supabase_client():
    return mock_supabase_client

def mock_initialize_supabase_client():
    pass

# Mock Supabase before importing app to prevent initialization errors
with patch('backend.services.supabase_client.initialize_supabase_client', mock_initialize_supabase_client):
    with patch('backend.services.supabase_client.get_supabase_client', mock_get_supabase_client):
        from backend.app.main import app

client = TestClient(app)
headers = {"X-Internal-Code": "hermes"}

@patch.dict(os.environ, {
    'SUPABASE_URL': 'https://test.supabase.co',
    'SUPABASE_KEY': 'test_key'
})
@patch('backend.services.supabase_client.get_supabase_client', mock_get_supabase_client)
@patch('backend.services.gpt_handler.run_llm')
def test_estimate_endpoint_happy_path(mock_run_llm):
    """Test the estimate endpoint with valid data"""
    # Mock the LLM response
    mock_run_llm.return_value = '[{"item":"Concrete slab","qty":100,"unit":"sqft","unit_price":10,"total":1000}]'

    payload = {"query":"Estimate my project","content":"Concrete slab 100 sqft at $10/sqft."}
    r = client.post("/api/analyze", json=payload, headers=headers)
    
    print(f"Test: {test_estimate_endpoint_happy_path.__name__}, Status Code: {r.status_code}")
    print(f"Test: {test_estimate_endpoint_happy_path.__name__}, Raw Content: {r.content}")
    
    assert r.status_code == 200
    response_json = r.json()
    print(f"Test: {test_estimate_endpoint_happy_path.__name__}, JSON Response: {response_json}")
    # Validate that we got a successful response
    assert "task_id" in response_json

@patch.dict(os.environ, {
    'SUPABASE_URL': 'https://test.supabase.co',
    'SUPABASE_KEY': 'test_key'
})
@patch('backend.services.supabase_client.get_supabase_client', mock_get_supabase_client)
def test_export_endpoint_happy_path():
    """Test the export endpoint with valid data"""
    payload = {"query":"Export my estimate","estimate":[{"item":"foo","qty":1,"unit":"u","unit_price":1,"total":1}]}
    r = client.post("/api/analyze", json=payload, headers=headers)
    
    print(f"Test: {test_export_endpoint_happy_path.__name__}, Status Code: {r.status_code}")
    print(f"Test: {test_export_endpoint_happy_path.__name__}, Raw Content: {r.content}")
    
    assert r.status_code == 200
    response_json = r.json()
    print(f"Test: {test_export_endpoint_happy_path.__name__}, JSON Response: {response_json}")
    # Validate that we got a successful response
    assert "task_id" in response_json

def test_bad_internal_code():
    payload = {"query":"Estimate my project","content":"Concrete slab 100 sqft at $10/sqft."}
    bad_headers = {"X-Internal-Code": "wrong"}
    r = client.post("/api/analyze", json=payload, headers=bad_headers)
    assert r.status_code == 401
