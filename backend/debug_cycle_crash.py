import sys
import os
import pandas as pd
import numpy as np
import traceback

# Add current dir to path
sys.path.append(os.getcwd())

try:
    from cycle_analysis import perform_cycle_analysis
    import yfinance as yf
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def test_analysis():
    print("Fetching data for AAPL...")
    df = yf.download("AAPL", period="1y", interval="1d", auto_adjust=False, progress=False, multi_level_index=False)
    
    if df.empty:
        print("Data empty.")
        return

    df = df.reset_index()
    # Flatten columns if multi-index (though yf fix above handles it, just in case)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    # Ensure simpler column names
    # perform_cycle_analysis expects 'Close' and 'Date'
    print("Columns:", df.columns.tolist())
    
    print("Running Analysis...")
    try:
        results = perform_cycle_analysis(df, "Close")
        print("Analysis Success!")
        print("Keys:", results.keys())
        if 'spectrum_full' in results:
            print("Spectrum points:", len(results['spectrum_full']))
            print("First spectrum point:", results['spectrum_full'][0])
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    test_analysis()
