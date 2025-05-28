from backend.agents.exporter_agent import handle as exporter_handle
from backend.app.schemas import AppState, EstimateItem # Import Pydantic models

def test_exporter_happy_path():
    initial_estimate = [EstimateItem(item="a",qty=1,unit="u",unit_price=1,total=1),
                        EstimateItem(item="b",qty=2,unit="u",unit_price=2,total=4)]
    state_dict = AppState(estimate=initial_estimate).model_dump()
    
    out_dict = exporter_handle(state_dict)
    out_state = AppState(**out_dict)

    assert out_state.export == "Exported estimate with 2 items."
    assert out_state.error is None
    assert any(log.agent == "exporter" and "export done" in log.decision for log in out_state.agent_trace)

def test_exporter_error_path():
    # Test with empty estimate list (Pydantic default) to ensure it handles it as an error or specific case
    state_dict = AppState(estimate=[]).model_dump() # Intentionally empty
    out_dict = exporter_handle(state_dict)
    out_state = AppState(**out_dict)

    assert out_state.error is not None
    assert "Missing estimate data" in out_state.error
    assert any(log.agent == "exporter" and log.level == "error" for log in out_state.agent_trace)
