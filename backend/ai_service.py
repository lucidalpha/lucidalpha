import os
import requests
import json
from typing import Optional

PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

def ask_perplexity(query: str, context: Optional[str] = None):
    api_key = os.environ.get("PERPLEXITY_API_KEY")
    if not api_key:
        return {"error": "PERPLEXITY_API_KEY not found in environment variables."}

    messages = [
        {"role": "system", "content": "You are a helpful financial analyst assistant. You provide concise, data-driven insights about financial assets, seasonality, and market trends. Avoid financial advice."}
    ]

    if context:
        messages.append({"role": "system", "content": f"Context:\n{context}"})

    messages.append({"role": "user", "content": query})

    payload = {
        "model": "sonar-pro",
        "messages": messages,
        "temperature": 0.2,
        "top_p": 0.9,
        "search_domain_filter": ["perplexity.ai"],
        "return_images": False,
        "return_related_questions": False,
        "search_recency_filter": "month",
        "top_k": 0,
        "stream": False,
        "presence_penalty": 0,
        "frequency_penalty": 1
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(PERPLEXITY_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Extract content
        if "choices" in data and len(data["choices"]) > 0:
            return {"answer": data["choices"][0]["message"]["content"]}
        else:
            return {"error": "No response from Perplexity API."}

    except requests.exceptions.HTTPError as e:
        return {"error": f"HTTP Error: {e.response.text if e.response else str(e)}"}
    except Exception as e:
        return {"error": f"Error calling Perplexity: {str(e)}"}
