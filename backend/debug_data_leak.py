
from analysis import fetch_ticker_data
import pandas as pd

def check_leak():
    tickers = ['GS', 'HD', 'CSCO', 'KO']
    for t in tickers:
        print(f"Fetching {t}...")
        df = fetch_ticker_data(t)
        if df is None:
            print(f"  {t}: No data")
            continue
            
        # Check Price on 2015-10-01 or close
        try:
            subset = df[(df['Date'] >= '2015-10-01') & (df['Date'] <= '2015-10-10')]
            if not subset.empty:
                print(f"  {t} Price 2015-10: {subset.iloc[0]['Close']:.2f}")
            else:
                print(f"  {t}: No 2015 data")
        except Exception as e:
            print(f"  Error checking {t}: {e}")

if __name__ == "__main__":
    check_leak()
