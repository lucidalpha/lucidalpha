
import pandas as pd
import requests

def get_html_with_headers(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    r = requests.get(url, headers=headers)
    r.raise_for_status()
    return r.text

def debug_dow():
    url = "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average"
    try:
        print("Fetching Dow Jones HTML...")
        html = get_html_with_headers(url)
        tables = pd.read_html(html)
        print(f"Found {len(tables)} tables.")
        
        for i, df in enumerate(tables):
            print(f"\n--- Table {i} Columns: {df.columns.tolist()} ---")
            if not df.empty:
                print(df.head(3))
                
        # Simulate current logic
        df = tables[1]
        print("\nChecking Table 1 (Current Logic)...")
        if "Symbol" not in df.columns and "Ticker" not in df.columns:
            print("Symbol/Ticker not found in Table 1. Checking Table 0...")
            df = tables[0]
        
        col = "Symbol" if "Symbol" in df.columns else "Ticker"
        if col in df.columns:
            tickers = df[col].tolist()
            print(f"Found {len(tickers)} tickers: {tickers[:5]}")
        else:
            print("FAILED to find Ticker column in selected table.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_dow()
