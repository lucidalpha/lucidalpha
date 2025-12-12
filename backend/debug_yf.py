import yfinance as yf
import pandas as pd
import sys

log = []

def print_log(msg):
    log.append(str(msg))
    print(msg)

try:
    print_log("Attempting to download AAPL...")
    df = yf.download("AAPL", period="1y", interval="1d", auto_adjust=False, progress=False, multi_level_index=False)
    
    print_log(f"Empty? {df.empty}")
    print_log(f"Shape: {df.shape}")
    print_log(f"Columns: {df.columns.tolist()}")
    
    if not df.empty:
        print_log("First 2 rows:")
        print_log(df.head(2).to_string())
        
        # Check specific bug compatibility
        if isinstance(df.columns, pd.MultiIndex):
            print_log("WARNING: MultiIndex columns detected!")
        else:
            print_log("Columns are flat.")

except Exception as e:
    print_log(f"CRITICAL ERROR: {e}")

with open("debug_yf_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(log))
