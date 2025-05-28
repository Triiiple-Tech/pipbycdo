import os

AGENT_MODELS = {
    "estimator": "gpt-4",
    "manager": "gpt-3.5-turbo"
}

def select_llm(agent_name, state):
    return {"model": AGENT_MODELS.get(agent_name), "api_key": os.getenv("OPENAI_API_KEY")}
