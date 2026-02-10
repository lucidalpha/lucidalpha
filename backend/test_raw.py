
import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}

print("Testing raw connection to Yahoo Finance...")
try:
    r = requests.get('https://query2.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d', headers=headers, timeout=5)
    print(f"Status Code: {r.status_code}")
    print(f"Content Start: {r.text[:200]}")
    if "Too Many Requests" in r.text or r.status_code == 429:
        print("RESULT: Rate Limited / Blocked (429)")
    elif r.status_code == 403 or "Forbidden" in r.text:
        print("RESULT: Access Forbidden (403) - Likely Blocked")
    else:
        print("RESULT: Seems OK (technically)")
except Exception as e:
    print(f"Connection Error: {e}")
