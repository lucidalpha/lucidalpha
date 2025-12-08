
import pandas as pd
import os

CACHE_FILE = "cftc_combined_v2.csv"

if not os.path.exists(CACHE_FILE):
    print("Cache file not found.")
else:
    print(f"Reading {CACHE_FILE}...")
    df = pd.read_csv(CACHE_FILE, parse_dates=['date'], low_memory=False)
    
    # Filter for DX=F or similar to reduce noise
    target_code = "098662" # DX
    subset = df[df['cftc_code'] == target_code].sort_values('date')
    
    print(f"Data range: {subset['date'].min()} to {subset['date'].max()}")
    print(f"Total rows: {len(subset)}")
    
    # Check for gaps > 14 days
    subset['diff'] = subset['date'].diff().dt.days
    gaps = subset[subset['diff'] > 14]
    
    if not gaps.empty:
        print("\nGaps found (>14 days):")
        for idx, row in gaps.iterrows():
            prev_date = subset.loc[idx-1]['date'] if idx-1 in subset.index else "Unknown" # Note: loc/iloc mix, careful
            # Safe prev date check
            prev_idx = subset.index.get_loc(idx) - 1
            if prev_idx >= 0:
                prev_date = subset.iloc[prev_idx]['date']
            
            print(f"Gap ends: {row['date'].strftime('%Y-%m-%d')} (Gap size: {row['diff']} days). Previous: {prev_date}")
    else:
        print("No gaps > 14 days found.")
        
    # Check year counts
    print("\nRows per year:")
    print(subset['date'].dt.year.value_counts().sort_index())
