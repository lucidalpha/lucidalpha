
import requests
import json
import time

url = "http://localhost:8000/analyze_all_assets?lookback_years=15&min_win_rate=70"
print(f"Calling {url}...")
try:
    start = time.time()
    res = requests.get(url)
    print(f"Status: {res.status_code}")
    print(f"Time: {time.time() - start:.2f}s")
    data = res.json()
    print(f"Got {len(data)} patterns.")
    
    # Check if duplicate
    sigs = []
    for p in data[:5]:
        sig = f"{p['ticker']} {p['type']} {p['start_md']}-{p['end_md']} {p['win_rate']:.1f}"
        print(sig)
        
except Exception as e:
    print(f"Error: {e}")
