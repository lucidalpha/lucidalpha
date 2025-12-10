
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
# Force reload trigger


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
                    # Try to find Company Name
                    name_col = "Company"
                    if "Company" not in df.columns:
                         for c in df.columns:
                             if "company" in str(c).lower() or "security" in str(c).lower():
                                 name_col = c
                                 break
                    
                    results = []
                    for idx, row in df.iterrows():
                        t = str(row[target_col]).strip()
                        n = str(row[name_col]).strip() if name_col in df.columns else t
                        results.append({"ticker": t, "name": n})
                        
                    # Sanity check
                    if 10 <= len(results) <= 50:
                        return results

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
                return [{"ticker": str(row["Ticker"]).strip(), "name": str(row["Company"]).strip()} for idx, row in t.iterrows()]
            if "Symbol" in t.columns and "Company" in t.columns:
                return [{"ticker": str(row["Symbol"]).strip(), "name": str(row["Company"]).strip()} for idx, row in t.iterrows()]
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
                res = []
                # Try name
                name_col = "Company" if "Company" in t.columns else t.columns[0]
                for idx, row in t.iterrows():
                    tick = str(row["Ticker symbol"]).strip()
                    tick = tick if tick.endswith(".DE") else f"{tick}.DE"
                    name = str(row[name_col]).strip()
                    res.append({"ticker": tick, "name": name})
                return res
            if "Ticker" in t.columns and "Prime Standard" in str(t.columns): 
                 res = []
                 name_col = "Company" if "Company" in t.columns else "Name"
                 for idx, row in t.iterrows():
                     tick = str(row["Ticker"]).strip()
                     tick = tick if tick.endswith(".DE") else f"{tick}.DE"
                     nm = str(row[name_col]).strip() if name_col in t.columns else tick
                     res.append({"ticker": tick, "name": nm})
                 return res
            # Fallback for generic Ticker column
            if "Ticker" in t.columns and len(t) > 20 and len(t) < 50:
                 res = []
                 for idx, row in t.iterrows():
                     tick = str(row["Ticker"]).strip()
                     tick = tick if tick.endswith(".DE") else f"{tick}.DE"
                     res.append({"ticker": tick, "name": tick}) # Name unknown
                 return res
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



def process_ticker(ticker_obj, min_win_rate=70, min_year=2014, search_start_date=None, search_end_date=None, 
                  filter_mode=None, filter_odd_years=False, exclude_2020=False, filter_election=False, 
                  filter_midterm=False, filter_pre_election=False, filter_post_election=False):
    # Handle both string (legacy cache) and dict (new)
    if isinstance(ticker_obj, str):
        ticker = ticker_obj
        name = ticker_obj
    else:
        ticker = ticker_obj.get("ticker")
        name = ticker_obj.get("name", ticker)
        
    try:
        # Re-import inside process for safety if pickling issues arise, though top-level imports usually fine
        # from analysis import fetch_ticker_data, analyze_seasonality (already imported at top)
        
        df = fetch_ticker_data(ticker)
        if df is None or df.empty:
            return {"patterns": [], "error": "No Data"}
        
        if len(df) < 500: 
            return {"patterns": [], "error": "Insufficient Data"}
            
        patterns = analyze_seasonality(
            df, 
            lookback_years=datetime.now().year - min_year, # Convert min_year back to lookback
            min_win_rate=min_win_rate, 
            search_start_date=search_start_date, 
            search_end_date=search_end_date,
            filter_mode=filter_mode,
            filter_odd_years=filter_odd_years,
            exclude_2020=exclude_2020,
            filter_election=filter_election,
            filter_midterm=filter_midterm,
            filter_pre_election=filter_pre_election,
            filter_post_election=filter_post_election
        )
        for p in patterns:
            p['ticker'] = ticker
            p['asset_name'] = name
        return {"patterns": patterns, "error": None}

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR screening {ticker}: {str(e)}")
        return {"patterns": [], "error": str(e)}


def screen_index(index_name, min_win_rate=70, min_year=2014, search_start_date=None, search_end_date=None,
                 filter_mode=None, filter_odd_years=False, exclude_2020=False, filter_election=False, 
                 filter_midterm=False, filter_pre_election=False, filter_post_election=False):
                 
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
    
    # ProcessPool for true parallelism
    print(f"DEBUG: Starting parallel screening (ProcessPool) for {len(tickers)} tickers...")
    
    # Use functools.partial to pass the constant arguments
    import functools
    worker = functools.partial(process_ticker, 
                               min_win_rate=min_win_rate, 
                               min_year=min_year, 
                               search_start_date=search_start_date, 
                               search_end_date=search_end_date,
                               filter_mode=filter_mode,
                               filter_odd_years=filter_odd_years,
                               exclude_2020=exclude_2020,
                               filter_election=filter_election,
                               filter_midterm=filter_midterm,
                               filter_pre_election=filter_pre_election,
                               filter_post_election=filter_post_election)

    with concurrent.futures.ProcessPoolExecutor() as executor:
        # Map is cleaner for ProcessPool
        results = list(executor.map(worker, tickers))
        
        # Collect results
        for res in results:
            scanned_count += 1
            if res.get("error"):
                 # Extract ticker from error message if possible, or just log
                 errors.append(res["error"])
            
            if res.get("patterns"):
                all_patterns.extend(res["patterns"])

    # Sort Global Results
    all_patterns.sort(key=lambda x: x['win_rate'], reverse=True)
    
    return {
        "results": all_patterns,
        "tickers_found": len(tickers),
        "scanned_count": scanned_count,
        "error_count": len(errors),
        "sample_errors": errors[:5]
    }
