
import sys
import os
sys.path.append(os.getcwd())
import pandas as pd
from analysis import fetch_ticker_data, analyze_seasonality
import traceback

def test_full_flow():
    ticker = "AMGN"
    print(f"Testing flow for {ticker}...")
    try:
        df = fetch_ticker_data(ticker)
        print(f"Fetch success. Rows: {len(df) if df is not None else 'None'}")
        
        if df is not None:
            print("Analyzing seasonality...")
            # Params from screener reproduction
            min_year = 2015
            min_win_rate = 70
            search_start = "01.09"
            search_end = "31.10"
            
            patterns = analyze_seasonality(
                df,
                min_year=min_year,
                min_win_rate=min_win_rate,
                search_start_date=search_start,
                search_end_date=search_end
            )
            print(f"Analysis success. Patterns found: {len(patterns)}")
            if patterns:
                print(patterns[0])
            else:
                print("No patterns found.")
                
    except Exception as e:
        print("Flow Failed!")
        traceback.print_exc()

if __name__ == "__main__":
    test_full_flow()
