
import requests
import json
import pandas as pd
from datetime import datetime

# SEC requires a proper User-Agent: "Sample Company Name AdminContact@sample.com"
HEADERS = {
    "User-Agent": "SeasonalityApp contact@example.com",
    "Accept-Encoding": "gzip, deflate"
}

def get_cik_map():
    # Downloads the official Ticker -> CIK mapping
    url = "https://www.sec.gov/files/company_tickers.json"
    print(f"Downloading CIK map from {url}...")
    r = requests.get(url, headers=HEADERS)
    if r.status_code != 200:
        print(f"Error fetching CIK map: {r.status_code}")
        return {}
    
    data = r.json()
    # Data structure is index based: {0: {'cik_str': 320193, 'ticker': 'AAPL', 'title': 'Apple Inc.'}, ...}
    
    mapping = {}
    for entry in data.values():
        mapping[entry['ticker']] = entry['cik_str']
        
    return mapping

def get_recent_filings(ticker, cik_map):
    if ticker not in cik_map:
        print(f"Ticker {ticker} not found in SEC CIK mapping.")
        return
    
    cik = cik_map[ticker]
    # SEC CIKs must be 10 digits zero-padded
    cik_padded = str(cik).zfill(10)
    
    url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
    print(f"Fetching Submissions for {ticker} (CIK: {cik}) from {url}...")
    
    r = requests.get(url, headers=HEADERS)
    if r.status_code != 200:
        print(f"Error fetching submissions: {r.status_code}")
        return
        
    data = r.json()
    filings = data.get('filings', {}).get('recent', {})
    
    if not filings:
        print("No recent filings found.")
        return

    # Convert to DataFrame for easier filtering
    df = pd.DataFrame(filings)
    
    # Filter for Form 4 (Insider Trading) and 10-Q/10-K (Financials)
    # Form 4: Statement of changes in beneficial ownership of securities
    insider_trades = df[df['form'] == '4'].head(5)
    
    print("\n--- Recent Insider Trades (Form 4) ---")
    if not insider_trades.empty:
        print(insider_trades[['form', 'filingDate', 'primaryDocument', 'accessionNumber']].to_string())
    else:
        print("No recent Form 4 filings found.")
        
    # Check for 13F (Institutional Manager) - usually not filed BY the company, but BY the investor.
    # However, some companies are also investment managers.
    inst_filings = df[df['form'].str.contains('13F', case=False, na=False)]
    if not inst_filings.empty:
         print("\n--- Company 13F Filings (Is this company also an institution?) ---")
         print(inst_filings[['form', 'filingDate']].head())
    else:
         print("\n(Note: This company does not file 13Fs itself. To see who OWNS it, we need to process ALL 13Fs from other funds - 'Big Data' task).")

if __name__ == "__main__":
    ticker = "AAPL"
    
    # 1. Get Mapping
    cik_map = get_cik_map()
    
    # 2. Check Data
    if cik_map:
        get_recent_filings(ticker, cik_map)
