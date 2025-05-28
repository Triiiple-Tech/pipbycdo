# pipbycdo/backend/tests/test_api.py
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.schemas import AppState # Import Pydantic models
from typing import Optional # For type hinting
import backend.services.gpt_handler # For monkeypatching

client = TestClient(app)
headers = {"X-Internal-Code": "hermes"}

def test_estimate_endpoint_happy_path(monkeypatch): # Add monkeypatch argument
    # Mock the LLM call
    def mock_run_llm(prompt: str, model: Optional[str] = None, system_prompt: Optional[str] = None, **kwargs) -> str: # Use Optional for model and system_prompt
        return '[{"item":"Concrete slab","qty":100,"unit":"sqft","unit_price":10,"total":1000}]'
    monkeypatch.setattr(backend.services.gpt_handler, "run_llm", mock_run_llm)

    payload = {"query":"Estimate my project","content":"Concrete slab 100 sqft at $10/sqft."}
    r = client.post("/api/analyze", json=payload, headers=headers)
    print(f"Test: {test_estimate_endpoint_happy_path.__name__}, Status Code: {r.status_code}")
    print(f"Test: {test_estimate_endpoint_happy_path.__name__}, Raw Content: {r.content}")
    assert r.status_code == 200
    response_json = r.json()
    print(f"Test: {test_estimate_endpoint_happy_path.__name__}, JSON Response: {response_json}")
    # Validate with Pydantic model
    validated_response = AppState(**response_json)
    assert validated_response.estimate is not None
    assert len(validated_response.estimate) == 1
    assert validated_response.estimate[0].item == "Concrete slab"
    assert validated_response.error is None

def test_export_endpoint_happy_path():
    payload = {"query":"Export my estimate","estimate":[{"item":"foo","qty":1,"unit":"u","unit_price":1,"total":1}]}
    r = client.post("/api/analyze", json=payload, headers=headers)
    print(f"Test: {test_export_endpoint_happy_path.__name__}, Status Code: {r.status_code}")
    print(f"Test: {test_export_endpoint_happy_path.__name__}, Raw Content: {r.content}")
    assert r.status_code == 200
    response_json = r.json()
    print(f"Test: {test_export_endpoint_happy_path.__name__}, JSON Response: {response_json}")
    # Validate with Pydantic model
    validated_response = AppState(**response_json)
    assert validated_response.export == "Exported estimate with 1 items."
    assert validated_response.error is None

def test_bad_internal_code():
    payload = {"query":"Estimate my project","content":"Concrete slab 100 sqft at $10/sqft."}
    bad_headers = {"X-Internal-Code": "wrong"}
    r = client.post("/api/analyze", json=payload, headers=bad_headers)
    assert r.status_code == 401
