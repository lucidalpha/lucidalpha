
import os
import json
import time
import requests
import pandas as pd
import concurrent.futures
from datetime import datetime
from analysis import fetch_ticker_data, analyze_seasonality

# Configuration
INDICES_DIR = "indices"
os.makedirs(INDICES_DIR, exist_ok=True)
CACHE_DURATION_CONST = 15552000  # 180 days (approx 6 months)

def get_html_with_headers(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    r = requests.get(url, headers=headers)
    r.raise_for_status()
    return r.text


def fetch_dow_jones():
    url = "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average"
    try:
        html = get_html_with_headers(url)
        tables = pd.read_html(html)
        
        # Iterate to find the constituents table
        for df in tables:
            # Check for common column names
            cols = [str(c).lower() for c in df.columns]
            if "symbol" in cols or "ticker" in cols:
                # Identify the correct column name (case-sensitive from original df)
                target_col = "Symbol" if "Symbol" in df.columns else ("Ticker" if "Ticker" in df.columns else None)
                if not target_col:
                     # Case insensitive search
                     for c in df.columns:
                         if str(c).lower() in ["symbol", "ticker"]:
                             target_col = c
                             break
                
                if target_col:
                    tickers = df[target_col].tolist()
                    # Sanity check: Dow should have roughly 30 tickers
                    if 10 <= len(tickers) <= 50:
                        return [str(t).strip() for t in tickers]

        print("Dow Jones: Could not find table with Symbol/Ticker.")
        return []
    except Exception as e:
        print(f"Error fetching Dow: {e}")
        return []

def fetch_nasdaq_100():
    url = "https://en.wikipedia.org/wiki/Nasdaq-100"
    try:
        html = get_html_with_headers(url)
        tables = pd.read_html(html)
        for t in tables:
            if "Ticker" in t.columns and "Company" in t.columns:
                return [x.strip() for x in t["Ticker"].tolist()]
            if "Symbol" in t.columns and "Company" in t.columns:
                return [x.strip() for x in t["Symbol"].tolist()]
        return []
    except Exception as e:
        print(f"Error fetching Nasdaq: {e}")
        return []

def fetch_dax():
    url = "https://en.wikipedia.org/wiki/DAX"
    try:
        html = get_html_with_headers(url)
        tables = pd.read_html(html)
        for t in tables:
            if "Ticker symbol" in t.columns:
                tickers = t["Ticker symbol"].tolist()
                return [t.strip() if t.strip().endswith(".DE") else f"{t.strip()}.DE" for t in tickers]
            if "Ticker" in t.columns and "Prime Standard" in str(t.columns): # Heuristic for DAX table
                 tickers = t["Ticker"].tolist()
                 return [t.strip() if t.strip().endswith(".DE") else f"{t.strip()}.DE" for t in tickers]
            # Fallback for generic Ticker column in DAX table
            if "Ticker" in t.columns and len(t) > 20 and len(t) < 50:
                 tickers = t["Ticker"].tolist()
                 return [t.strip() if t.strip().endswith(".DE") else f"{t.strip()}.DE" for t in tickers]
        return []
    except Exception as e:
        print(f"Error fetching DAX: {e}")
        return []

INDEX_FETCHERS = {
    "dow": fetch_dow_jones,
    "nasdaq": fetch_nasdaq_100,
    "dax": fetch_dax
}


            

def get_index_constituents(index_name):
    index_name = index_name.lower()
    if index_name not in INDEX_FETCHERS:
        raise ValueError(f"Unknown index: {index_name}")
        
    file_path = os.path.join(INDICES_DIR, f"{index_name}.json")
    
    # Check cache
    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
                timestamp = data.get("timestamp", 0)
                tickers = data.get("tickers", [])
                
                # Check if valid and not empty
                if (time.time() - timestamp) < CACHE_DURATION_CONST and len(tickers) > 0:
                    print(f"DEBUG: Cache hit for {index_name}. found {len(tickers)} tickers.")
                    return tickers
                else:
                    print(f"DEBUG: Cache expired or empty for {index_name}. Refreshing...")
        except Exception as e:
            print(f"DEBUG: Cache read failed for {index_name}: {e}")
            pass # Force update if read fails
            
    # Update
    print(f"Updating constituents for {index_name}...")
    tickers = INDEX_FETCHERS[index_name]()
    if tickers:
        with open(file_path, "w") as f:
            json.dump({
                "timestamp": time.time(),
                "tickers": tickers
            }, f)
        print(f"DEBUG: Successfully updated {index_name} with {len(tickers)} tickers.")
    else:
        print(f"ERROR: Failed to fetch constituents for {index_name}.")
        
    return tickers


def screen_index(index_name, min_win_rate=70, min_year=2014, search_start_date=None, search_end_date=None):
    print(f"DEBUG: screen_index called with index={index_name}")
    try:
        tickers = get_index_constituents(index_name)
    except Exception as e:
        print(f"ERROR getting constituents: {e}")
        return {"error": f"Failed to load index: {str(e)}", "results": []}

    print(f"DEBUG: Found {len(tickers)} tickers for {index_name}")
    
    if not tickers:
        return {"error": f"No tickers found for index {index_name}. Wikipedia fetch might have failed.", "results": []}
        
    all_patterns = []
    errors = []
    scanned_count = 0
    
    def process_ticker(ticker):
        try:
            df = fetch_ticker_data(ticker)
            if df is None or df.empty:
                return {"patterns": [], "error": "No Data"}
            
            if len(df) < 500: 
                return {"patterns": [], "error": "Insufficient Data"}
                
            patterns = analyze_seasonality(
                df, 
                min_year=min_year, 
                min_win_rate=min_win_rate, 
                search_start_date=search_start_date, 
                search_end_date=search_end_date
            )
            for p in patterns:
                p['ticker'] = ticker
                p['asset_name'] = ticker 
            return {"patterns": patterns, "error": None}

        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"ERROR screening {ticker}: {str(e)}")
            return {"patterns": [], "error": str(e)}

    # Parallel Processing
    print(f"DEBUG: Starting parallel screening with 5 workers for {len(tickers)} tickers...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_ticker = {executor.submit(process_ticker, t): t for t in tickers}
        for future in concurrent.futures.as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            scanned_count += 1
            try:
                res = future.result()
                if res["error"]:
                    errors.append(f"{ticker}: {res['error']}")
                
                if res["patterns"]:
                    all_patterns.extend(res["patterns"])
            except Exception as e:
                errors.append(f"{ticker}: Thread Error {str(e)}")
                print(f"Thread error: {e}")

    # Sort Global Results
    all_patterns.sort(key=lambda x: x['win_rate'], reverse=True)
    
    return {
        "results": all_patterns,
        "tickers_found": len(tickers),
        "scanned_count": scanned_count,
        "error_count": len(errors),
        "sample_errors": errors[:5]
    }
