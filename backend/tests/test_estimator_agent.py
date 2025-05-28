from backend.agents.estimator_agent import handle as estimator_handle
from backend.app.schemas import AppState # Import Pydantic models
import backend.services.gpt_handler # For monkeypatching

def test_estimator_happy_path(monkeypatch):
    monkeypatch.setattr(
        backend.services.gpt_handler,
        "run_llm",
        lambda prompt, model=None, system_prompt=None, **kw: '[{"item":"c","qty":2,"unit":"u","unit_price":3,"total":6}]'
    )

    state_dict = AppState(query="Estimate", content="some content").model_dump()
    out_dict = estimator_handle(state_dict)
    out_state = AppState(**out_dict)

    assert out_state.estimate is not None
    assert len(out_state.estimate) == 1
    assert out_state.estimate[0].item == "c"
    assert out_state.error is None
    assert any(log.agent == "estimator" and "estimate complete" in log.decision for log in out_state.agent_trace)

def test_estimator_error_path(monkeypatch):
    monkeypatch.setattr(
        backend.services.gpt_handler,
        "run_llm",
        lambda prompt, model=None, system_prompt=None, **kw: 'not a json'
    )

    state_dict = AppState(query="Estimate", content="some content").model_dump()
    out_dict = estimator_handle(state_dict)
    out_state = AppState(**out_dict)

    assert out_state.error is not None
    assert any(log.agent == "estimator" and log.level == "error" for log in out_state.agent_trace)
