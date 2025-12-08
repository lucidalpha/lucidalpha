import yfinance as yf
import pandas as pd
import time

ALL_ASSETS = [
    {"name": "US Dollar Index Futures", "ticker": "DX=F"},
    {"name": "Canadian Dollar Futures", "ticker": "6C=F"},
    {"name": "Australian Dollar Futures", "ticker": "6A=F"},
    {"name": "British Pound Futures", "ticker": "6B=F"}, # Checking just a few for speed
    {"name": "Palladium Futures", "ticker": "PA=F"},
    {"name": "NASDAQ 100 E-Mini Futures", "ticker": "NQ=F"}
]

print("Starting bulk download test...")
tickers = [a["ticker"] for a in ALL_ASSETS]

try:
    # Mimic the main.py call
    data = yf.download(tickers, period="max", group_by='ticker', progress=False, threads=True)
    
    print("\nDownload finished.")
    print(f"Type of data: {type(data)}")
    print(f"Data columns type: {type(data.columns)}")
    print(f"Data shape: {data.shape}")
    
    if isinstance(data.columns, pd.MultiIndex):
        print("Columns are MultiIndex.")
        print("Level 0 values (Tickers):", data.columns.levels[0])
    else:
        print("Columns are Single Index.")
        print(data.columns)

    print("\n--- Simulating Loop ---")
    for asset in ALL_ASSETS:
        ticker = asset['ticker']
        print(f"Checking {ticker}...", end=" ")
        
        df = None
        if isinstance(data.columns, pd.MultiIndex):
            if ticker in data.columns:
                df = data[ticker]
                print(f"Found in MultiIndex. Shape: {df.shape}")
            else:
                print("NOT FOUND in MultiIndex.")
        else:
            print("Single Index found. Assuming it belongs to... who?")
            # This is the danger zone.
            df = data
            
        if df is not None and not df.empty:
            if 'Close' in df.columns:
                print(f"Has Close. NaNs: {df['Close'].isna().sum()}/{len(df)}")
            else:
                print("No Close column.")
        else:
            print("DF is None or Empty")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
