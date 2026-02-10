
import yfinance as yf
import requests
import json
import pandas as pd

# 1. Debug Yahoo Finance Major Holders
def debug_yf_holders(ticker_symbol):
    print(f"\n--- Debugging YF for {ticker_symbol} ---")
    stock = yf.Ticker(ticker_symbol)
    
    try:
        major = stock.major_holders
        print("Raw Major Holders:")
        print(major)
        # Check type
        print(f"Type: {type(major)}")
        
        # Try to parse
        breakdown = {"insiders": 0.0, "institutions": 0.0, "public": 0.0}
        
        # Current logic simulation (adjust based on what we see)
        if major is not None and not major.empty:
            # Different versions of yfinance return different structures
            # Old: DataFrame with column 0 (value) and 1 (label)
            # New: Series or different index
            print("Columns:", major.columns if hasattr(major, 'columns') else "No columns")
            
            # extract
            for index, row in major.iterrows():
                print(f"Row {index}: {row.values}")
                
    except Exception as e:
        print(f"Error reading major_holders: {e}")

# 2. Debug SEC CIK and Filings
def debug_sec(ticker):
    print(f"\n--- Debugging SEC for {ticker} ---")
    headers = {"User-Agent": "SeasonalityApp contact@example.com"}
    
    # 1. CIK Map
    try:
        r = requests.get("https://www.sec.gov/files/company_tickers.json", headers=headers)
        if r.status_code == 200:
            data = r.json()
            # print(str(data)[:200]) # First few chars
            
            # Find ticker
            found_cik = None
            for idx, entry in data.items():
                if entry['ticker'] == ticker.upper():
                    found_cik = entry['cik_str']
                    print(f"Found CIK: {found_cik}")
                    break
            
            if found_cik:
                # 2. Filings
                cik_padded = str(found_cik).zfill(10)
                url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
                print(f"Fetching filings from: {url}")
                
                r2 = requests.get(url, headers=headers)
                if r2.status_code == 200:
                    fdata = r2.json()
                    recent = fdata['filings']['recent']
                    forms = recent['form']
                    print(f"Total recent filings: {len(forms)}")
                    print(f"Last 10 forms: {forms[:10]}")
                    
                    # Check for Form 4
                    if '4' in forms:
                        print("Found Form 4!")
                    else:
                        print("No Form 4 found in recent list.")
                else:
                    print(f"Failed to fetch submissions. Status: {r2.status_code}")
            else:
                print("Ticker not found in CIK map.")
        else:
            print(f"Failed to fetch CIK map. Status: {r.status_code}")
    except Exception as e:
        print(f"SEC Error: {e}")

if __name__ == "__main__":
    debug_yf_holders("AAPL")
    debug_sec("AAPL")
