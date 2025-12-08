import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)
import yfinance as yf
import pandas as pd

def check():
    tickers = ["ZB=F", "DX=F", "NQ=F", "^GDAXI", "CL=F", "GC=F"]
    print("Checking Start Dates:")
    for t in tickers:
        try:
            df = yf.download(t, period="max", progress=False)
            if not df.empty:
                start = df.index[0]
                print(f"{t}: {start.strftime('%Y-%m-%d')}")
            else:
                print(f"{t}: No Data")
        except Exception as e:
            print(f"{t}: Error {e}")

if __name__ == "__main__":
    check()
