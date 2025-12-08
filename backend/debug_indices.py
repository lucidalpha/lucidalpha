
import pandas as pd
import requests


def get_html_with_headers(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    r = requests.get(url, headers=headers)
    r.raise_for_status()
    return r.text

def get_dow_jones():
    url = "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average"
    try:
        html = get_html_with_headers(url)
        tables = pd.read_html(html)
        # Usually the constituents are in the second table (index 1) or look for "Symbol"
        df = tables[1] # check this index
        if "Symbol" not in df.columns and "Ticker" not in df.columns:
            df = tables[0]
        
        # Normalize column name
        col = "Symbol" if "Symbol" in df.columns else "Ticker"
        tickers = df[col].tolist()
        return tickers
    except Exception as e:
        print(f"Error fetching Dow: {e}")
        return []

def get_nasdaq_100():
    url = "https://en.wikipedia.org/wiki/Nasdaq-100"
    try:
        html = get_html_with_headers(url)
        tables = pd.read_html(html)
        # Look for table with "Ticker"
        for t in tables:
            if "Ticker" in t.columns and "Company" in t.columns:
                return t["Ticker"].tolist()
            if "Symbol" in t.columns and "Company" in t.columns:
                return t["Symbol"].tolist()
        return []
    except Exception as e:
        print(f"Error fetching Nasdaq: {e}")
        return []

def get_dax():
    url = "https://en.wikipedia.org/wiki/DAX"
    try:
        html = get_html_with_headers(url)
        tables = pd.read_html(html)
        # Look for generic table logic
        for t in tables:
            if "Ticker symbol" in t.columns: # English wiki often uses 'Ticker symbol'
                # DAX tickers on Yahoo often need .DE suffix if not present
                tickers = t["Ticker symbol"].tolist()
                return [t if t.endswith(".DE") else f"{t}.DE" for t in tickers]
            if "Ticker" in t.columns:
                 tickers = t["Ticker"].tolist()
                 # Clean up specific wiki oddities if any
                 return [t if t.endswith(".DE") else f"{t}.DE" for t in tickers]
        return []
    except Exception as e:
        print(f"Error fetching DAX: {e}")
        return []

if __name__ == "__main__":
    print("Fetching Dow...")
    dow = get_dow_jones()
    print(f"Dow: {len(dow)} tickers: {dow[:5]}")
    
    print("\nFetching Nasdaq 100...")
    ndx = get_nasdaq_100()
    print(f"Nasdaq: {len(ndx)} tickers: {ndx[:5]}")
    
    print("\nFetching DAX...")
    dax = get_dax()
    print(f"DAX: {len(dax)} tickers: {dax[:5]}")
