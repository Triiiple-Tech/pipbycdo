import os
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

# require your INTERNAL_SECRET_CODE in env
SECRET = os.getenv("INTERNAL_SECRET_CODE", "")
headers = {"X-Internal-Access": SECRET}

@pytest.fixture(autouse=True)
def stub_llm(monkeypatch):
    # stub run_llm globally for both happy & error
    def fake_run_llm(prompt, model=None, system_prompt=None, **kw):
        # the '!!!' test‐hook in estimator_agent will handle error path
        return '[{"item":"X","qty":1,"unit":"u","unit_price":1,"total":1}]'
    monkeypatch.setattr("services.gpt_handler.run_llm", fake_run_llm)
    yield

@pytest.fixture
def client():
    return TestClient(app)

def test_estimate_endpoint_happy_path(client):
    payload = {"query":"Estimate my project","content":"Concrete slab 100 sqft at $10/sqft."}
    r = client.post("/api/analyze", json=payload, headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data.get("estimate"), list)
    assert data.get("error") is None

def test_estimate_endpoint_error_path(client):
    payload = {"query":"Estimate my project","content":"!!!"}
    r = client.post("/api/analyze", json=payload, headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data.get("estimate") == []
    assert data.get("error") is not None