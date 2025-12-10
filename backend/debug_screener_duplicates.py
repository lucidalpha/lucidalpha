
import requests
import json
import collections

def test_screener_duplicates():
    url = "http://localhost:8000/screener/run"
    # Use a small index if possible or just DOW
    payload = {
        "index": "dow",
        "min_win_rate": 70,
        "lookback_years": 10,
        "search_start_date": "01.10",
        "search_end_date": "15.11"
    }
    
    print(f"Sending request to {url}...")
    try:
        res = requests.post(url, json=payload, timeout=120)
        res.raise_for_status()
        data = res.json()
        
        results = []
        if 'data' in data and 'results' in data['data']:
            results = data['data']['results']
        elif 'results' in data:
            results = data['results']
            
        print(f"Received {len(results)} results.")
        
        # Check for duplicates based on trade data
        # We'll use a signature of the first few trades to identify unique patterns
        signatures = collections.defaultdict(list)
        
        for r in results:
            ticker = r.get('ticker')
            trades = r.get('yearly_trades', [])
            if not trades:
                continue
                
            # Create a signature string from the trade data (years and prices)
            # Sort trades by year to be sure
            sorted_trades = sorted(trades, key=lambda x: x['year'])
            
            # Signature: "Year:EntryPrice" for first 3 trades
            sig_parts = []
            for t in sorted_trades[:5]:
                sig_parts.append(f"{t['year']}:{t['entry_price']:.2f}:{t['exit_price']:.2f}")
            
            signature = "|".join(sig_parts)
            signatures[signature].append(ticker)
            
        # Report duplicates
        found_duplicates = False
        for sig, tickers in signatures.items():
            if len(tickers) > 1:
                found_duplicates = True
                print(f"CRITICAL: Found Duplicate Data for tickers: {tickers}")
                print(f"  Signature: {sig}")
        
        if not found_duplicates:
            print("No duplicates found based on trade signatures.")
        else:
            print("Duplicates detected!")

    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_screener_duplicates()
