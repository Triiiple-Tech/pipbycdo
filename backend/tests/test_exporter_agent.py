import pytest
from agents.exporter_agent import handle as exporter_handle

def test_exporter_happy_path():
    state = {
        "estimate": [
            {"item":"a","qty":1,"unit":"u","unit_price":1,"total":1},
            {"item":"b","qty":2,"unit":"u","unit_price":2,"total":4}
        ],
        "agent_trace": [],
        "meeting_log": []
    }
    out = exporter_handle(state)

    assert "export" in out
    assert "2 items" in out["export"]
    assert out.get("error") is None
    assert any("export done" in log["decision"] or "exported file" in log["decision"] for log in out["agent_trace"])

def test_exporter_error_path():
    # missing estimate list should error
    state = {"estimate": None, "agent_trace": [], "meeting_log": []}
    out = exporter_handle(state)

    assert out.get("error") is not None
    assert any(log.get("level") == "error" for log in out["agent_trace"])