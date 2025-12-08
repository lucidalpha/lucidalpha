import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_search():
    print("--- Testing Search 'Tesla' ---")
    try:
        r = requests.get(f"{BASE_URL}/search_ticker", params={"q": "Tesla"})
        if r.status_code == 200:
            data = r.json()
            results = data.get("results", [])
            print(f"Success. Found {len(results)} results.")
            if results:
                print(f"Top result: {results[0]}")
                return results[0]['symbol']
        else:
            print(f"Failed: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Error: {e}")
    return None

def test_analyze(ticker):
    print(f"\n--- Testing Analysis for '{ticker}' ---")
    try:
        start = time.time()
        r = requests.post(f"{BASE_URL}/analyze_ticker", json={"ticker": ticker})
        duration = time.time() - start
        
        if r.status_code == 200:
            data = r.json()
            patterns = data.get("results", [])
            chart = data.get("chart_data", [])
            print(f"Success ({duration:.2f}s).")
            print(f"Patterns found: {len(patterns)}")
            print(f"Chart info: {len(chart)} points")
        else:
            print(f"Failed: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    ticker = test_search()
    if ticker:
        test_analyze(ticker)
