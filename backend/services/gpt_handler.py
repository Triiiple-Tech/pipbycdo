# pipbycdo/backend/services/gpt_handler.py
import os
from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_llm(prompt, model="gpt-4o", system_prompt=None, **kwargs):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    resp = _client.chat.completions.create(
        model=model, messages=messages, **kwargs
    )
    return resp.choices[0].message.content.strip()