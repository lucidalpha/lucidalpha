import yfinance as yf
import pandas as pd

def check_gold():
    ticker = "GC=F"
    print(f"Fetching {ticker}...")
    df = yf.download(ticker, period="max", progress=False)
    
    if df.empty:
        print("Empty DataFrame returned.")
        return

    df = df.reset_index()
    print("Columns:", df.columns)
    
    if 'Date' in df.columns:
        print(f"Earliest Date: {df['Date'].min()}")
        print(f"Latest Date: {df['Date'].max()}")
        print(f"Total Rows: {len(df)}")
    else:
        print("Date column not found.")

if __name__ == "__main__":
    check_gold()
