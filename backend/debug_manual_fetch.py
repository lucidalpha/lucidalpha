import requests
import json
import pandas as pd
from datetime import datetime

def manual_fetch(ticker):
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}"
    params = {
        "range": "20y",
        "interval": "1d",
        "events": "div,splits"
    }
    headers = {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    print(f"Fetching {url}...")
    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
        print(f"Status: {r.status_code}")
        
        if r.status_code == 200:
            data = r.json()
            # Basic Parse
            try:
                result = data['chart']['result'][0]
                timestamps = result['timestamp']
                indicators = result['indicators']['quote'][0]
                opens = indicators['open']
                highs = indicators['high']
                lows = indicators['low']
                closes = indicators['close']
                volumes = indicators['volume']
                
                df = pd.DataFrame({
                    "Date": pd.to_datetime(timestamps, unit='s'),
                    "Open": opens,
                    "High": highs,
                    "Low": lows,
                    "Close": closes,
                    "Volume": volumes
                })
                print("Manual Fetch Success!")
                print(df.head())
                print(f"Shape: {df.shape}")
                return df
            except Exception as parse_e:
                 print(f"Parse Error: {parse_e}")
                 # sometimes it's error in expected structure
                 print(json.dumps(data, indent=2)[:500])
        else:
            print(f"Error Text: {r.text[:200]}")
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    manual_fetch("TSLA")
