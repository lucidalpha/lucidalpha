
import sys
import os
import pandas as pd

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from screener import get_index_constituents, screen_index, INDEX_FETCHERS
from analysis import fetch_ticker_data, analyze_seasonality

def check_indices():
    # specifically check NASDAQ
    name = "nasdaq"
    print(f"--- Checking {name} ---")
    try:
        tickers = get_index_constituents(name)
        print(f"Count: {len(tickers)}")
        if tickers:
            print(f"First 5: {tickers[:5]}")
            
            # Pick a known one
            target = "AAPL"
            if target not in tickers:
                target = tickers[0]
            
            print(f"Testing deep analysis for {target}...")
            df = fetch_ticker_data(target)
            if df is not None and not df.empty:
                print(f"Fetched {len(df)} rows. Range: {df['Date'].min()} to {df['Date'].max()}")
                
                # Test Analysis with specific params
                print("Running analysis with: min_year=2015, win_rate=67, window=07.12-31.12")
                patterns = analyze_seasonality(
                    df, 
                    min_year=2015, 
                    min_win_rate=67, 
                    search_start_date="07.12", 
                    search_end_date="31.12"
                )
                print(f"Found {len(patterns)} patterns.")
                if patterns:
                    print("Top 3:")
                    for p in patterns[:3]:
                        print(p)
            else:
                print(f"FAILURE: Could not fetch data for {target}")
    except Exception as e:
        print(f"Error checking {name}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_indices()
