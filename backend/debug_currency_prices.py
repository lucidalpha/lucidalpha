
import yfinance as yf
import pandas as pd

tickers = [
    "6S=F", "6E=F", "6B=F", "6J=F", "6A=F", "6C=F", "6N=F", "DX=F"
]

print(f"{'Ticker':<10} {'Latest Date':<12} {'Close':<10} {'Prev Close':<10}")
print("-" * 50)

for t in tickers:
    try:
        # Download last 5 days
        df = yf.download(t, period="5d", progress=False, multi_level_index=False)
        if df is None or df.empty:
            print(f"{t:<10} NO DATA")
            continue
            
        df = df.reset_index()
        last_row = df.iloc[-1]
        prev_row = df.iloc[-2] if len(df) > 1 else last_row
        
        date_str = last_row['Date'].strftime('%Y-%m-%d')
        close = last_row['Close']
        prev = prev_row['Close']
        
        print(f"{t:<10} {date_str:<12} {close:<10.4f} {prev:<10.4f}")
        
    except Exception as e:
        print(f"{t:<10} ERROR: {e}")
