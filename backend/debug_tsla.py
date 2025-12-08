import yfinance as yf
import pandas as pd
from analysis import fetch_ticker_data, prepare_data

def debug():
    ticker = "TSLA"
    print(f"Fetching {ticker}...")
    try:
        df = fetch_ticker_data(ticker)
        print("Fetch result:")
        print(df.head())
        print("Columns:", df.columns)
        print("Shape:", df.shape)
        
        if df.empty:
            print("DF IS EMPTY after fetch.")
        
        print("\nAttempting prepare_data...")
        try:
            df_prep = prepare_data(df, min_year=2014)
            print("Prepare success.")
            print(df_prep.head())
        except Exception as e:
            print(f"Prepare failed: {e}")
            
    except Exception as e:
        print(f"Fetch failed: {e}")

if __name__ == "__main__":
    debug()
