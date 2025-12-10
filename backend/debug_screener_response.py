
import requests
import json

def test_screener():
    url = "http://localhost:8000/screener/run"
    payload = {
        "index": "dow",
        "min_win_rate": 70,
        "lookback_years": 20,
        "search_start_date": "01.09",
        "search_end_date": "30.10"
    }
    
    try:
        print("Sending request to screener...")
        res = requests.post(url, json=payload)
        res.raise_for_status()
        data = res.json()
        
        # Check structure
        results = []
        if 'data' in data and 'results' in data['data']:
            results = data['data']['results']
        elif 'results' in data:
            results = data['results']
            
        print(f"Got {len(results)} results.")
        
        if results:
            first = results[0]
            print("First result keys:", first.keys())
            if 'yearly_trades' in first:
                print("yearly_trades found!")
                print(f"Count of trades: {len(first['yearly_trades'])}")
                print("Sample trade:", first['yearly_trades'][0] if first['yearly_trades'] else "None")
            else:
                print("ERROR: yearly_trades NOT found in result object.")
        else:
            print("No results found to check.")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_screener()
