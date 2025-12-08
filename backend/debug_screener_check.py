
import sys
import os

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from screener import get_index_constituents, screen_index, INDEX_FETCHERS
from analysis import fetch_ticker_data

def check_indices():
    for name in INDEX_FETCHERS.keys():
        print(f"--- Checking {name} ---")
        try:
            tickers = get_index_constituents(name)
            print(f"Count: {len(tickers)}")
            if tickers:
                print(f"First 5: {tickers[:5]}")
                # Test fetch first one
                first = tickers[0]
                print(f"Testing fetch for {first}...")
                df = fetch_ticker_data(first)
                if df is not None and not df.empty:
                    print(f"SUCCESS: Fetched {len(df)} rows for {first}")
                else:
                    print(f"FAILURE: Could not fetch data for {first}")
            else:
                print("FAILURE: No tickers found.")
        except Exception as e:
            print(f"Error checking {name}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    check_indices()
