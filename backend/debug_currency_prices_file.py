
import yfinance as yf
import pandas as pd

tickers = [
    "6S=F", "6E=F", "6B=F", "6J=F", "6A=F", "6C=F", "6N=F", "DX=F", "GC=F", "ES=F"
]

with open("price_check.txt", "w") as f:
    f.write(f"{'Ticker':<10} {'Latest Date':<12} {'Close':<10} {'Prev Close':<10}\n")
    f.write("-" * 50 + "\n")

    for t in tickers:
        try:
            # Download last 5 days
            df = yf.download(t, period="5d", progress=False, multi_level_index=False)
            if df is None or df.empty:
                f.write(f"{t:<10} NO DATA\n")
                continue
                
            if 'Date' not in df.columns:
                df = df.reset_index()
            
            # Helper to get scalar
            def get_val(r, col):
                val = r[col]
                # If Series (sometimes yfinance returns DataFrame for single col if multi-index issues)
                if isinstance(val, pd.Series):
                    val = val.iloc[0]
                return val

            last_row = df.iloc[-1]
            prev_row = df.iloc[-2] if len(df) > 1 else last_row
            
            date_str = get_val(last_row, 'Date').strftime('%Y-%m-%d')
            close = float(get_val(last_row, 'Close'))
            prev = float(get_val(prev_row, 'Close'))
            
            f.write(f"{t:<10} {date_str:<12} {close:<10.4f} {prev:<10.4f}\n")
            
        except Exception as e:
            f.write(f"{t:<10} ERROR: {e}\n")
print("Done")
