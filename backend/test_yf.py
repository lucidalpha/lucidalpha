
import yfinance as yf
import pandas as pd

try:
    print("Attempting yf.download for AAPL...")
    # Add threads=False to avoid threading issues in some envs
    df = yf.download("AAPL", period="1mo", interval="1d", auto_adjust=False, progress=False, threads=False)
    print("Download result type:", type(df))
    if not df.empty:
        print("Download successful. Rows:", len(df))
        print(df.head())
    else:
        print("Download returned empty DF.")
        
except Exception as e:
    print(f"Download Error: {e}")


