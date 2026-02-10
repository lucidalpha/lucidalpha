
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from analysis import fetch_ticker_data, analyze_seasonality
import pandas as pd

# Test 2 distinct assets
assets = ["6E=F", "GC=F"] # Euro and Gold

for ticker in assets:
    print(f"--- Processing {ticker} ---")
    df = fetch_ticker_data(ticker)
    if df is None:
        print("DF is None")
        continue
    
    print(f"Data shape: {df.shape}")
    print(f"Last date: {df.iloc[-1]['Date']}")
    print(f"Last close: {df.iloc[-1]['Close']}")
    
    # Analyze - look for December patterns specifically to match user case
    patterns = analyze_seasonality(
        df, 
        lookback_years=15, 
        min_win_rate=70,
        search_start_date=None,
        search_end_date=None
    )
    
    # Filter for Month=12 (December)
    dec_patterns = [p for p in patterns if p['start_md'][0] == 12]
    
    print(f"Found {len(dec_patterns)} Dec patterns.")
    if dec_patterns:
        top = dec_patterns[0]
        print(f"Top 1: {top['type']} Start: {top['start_md']} End: {top['end_md']} Win: {top['win_rate']}")
