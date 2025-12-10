import yfinance as yf
import pandas as pd

def check_tickers():
    tickers = ["GC=F", "XAUUSD=X"]
    
    for ticker in tickers:
        print(f"\nFetching {ticker}...")
        df = yf.download(ticker, period="max", progress=False)
        
        if df.empty:
            print(f"{ticker}: Empty DataFrame returned.")
            continue

        df = df.reset_index()
        if 'Date' in df.columns:
            print(f"{ticker} Earliest Date: {df['Date'].min()}")
            print(f"{ticker} Latest Date: {df['Date'].max()}")
        else:
            print(f"{ticker} Date column not found.")

if __name__ == "__main__":
    check_tickers()
