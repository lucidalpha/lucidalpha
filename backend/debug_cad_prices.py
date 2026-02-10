import yfinance as yf
import pandas as pd

def check_cad():
    ticker = "6C=F"
    print(f"Fetching {ticker}...")
    df = yf.download(ticker, start="2024-01-01", end="2025-02-01", progress=False)
    
    # Handle MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        try:
            # Try to drop ticker level
             df.columns = df.columns.droplevel(1)
        except:
            pass
    
    print(f"Columns: {df.columns}")

    print("\nSpecific Dates Check 2025:")
    dates_to_check = ["2025-01-23", "2025-01-07"]
    for d in dates_to_check:
        try:
            if d in df.index:
                row = df.loc[d]
                o = float(row['Open'])
                c = float(row['Close'])
                print(f"{d}: Open={o:.5f}, Close={c:.5f}")
            else:
                print(f"{d}: No Data in Index")
        except Exception as e:
            print(f"{d}: Error {e}")


if __name__ == "__main__":
    check_cad()
