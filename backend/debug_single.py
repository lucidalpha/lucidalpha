
import sys
import os
import pandas as pd
from datetime import datetime

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from analysis import analyze_seasonality, fetch_ticker_data

# Mock fetch or just use real one if quick
def test_analysis():
    print("Fetching data for MSFT...")
    try:
        df = fetch_ticker_data("MSFT")
        if df is None:
            print("Failed to fetch MSFT")
            return

        print(f"Data rows: {len(df)}")
        
        # Short analysis to get ANY pattern
        patterns = analyze_seasonality(
            df,
            min_year=2020,
            min_win_rate=10, 
            search_start_date="01.01",
            search_end_date="31.12"
        )
        
        if patterns:
            p = patterns[0]
            print("\nFirst Pattern Found:")
            print(f"Keys: {list(p.keys())}")
            if 'yearly_trades' in p:
                print(f"yearly_trades present! Count: {len(p['yearly_trades'])}")
                print(p['yearly_trades'][0])
            else:
                print("FAIL: yearly_trades MISSING")
        else:
            print("No patterns found.")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_analysis()
