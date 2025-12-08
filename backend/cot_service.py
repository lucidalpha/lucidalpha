import pandas as pd
import requests
import io
import datetime
import os
import zipfile
import numpy as np

# CONFIG
# CONFIG
CURRENT_YEAR = 2025
YEARS_HISTORY = list(range(2000, 2026))

# URLs - Legacy
URL_LEGACY_CURRENT = "https://www.cftc.gov/dea/newcot/deacot.txt" 
URL_LEGACY_HIST = "https://www.cftc.gov/files/dea/history/deacot{}.zip"

# URLs - TFF (Financial Futures)
# We will iterate lists in function

# Mapping
TICKER_TO_CFTC = {
    "DX=F": "098662", "6C=F": "090741", "6A=F": "232741", "6E=F": "099741",
    "6B=F": "096742", "6S=F": "092741", "6N=F": "112741", "6J=F": "097741",
    "CC=F": "073732", "ZS=F": "005602", "SB=F": "080732", "KC=F": "083731",
    "ZW=F": "001602", "ZC=F": "002602", "CL=F": "067651", "NG=F": "023651",
    "PA=F": "075651", "GC=F": "088691", "SI=F": "084691", "PL=F": "076651",
    "HG=F": "085692", "NQ=F": "209742", "ES=F": "13874+", "YM=F": "12460+",
    "RTY=F": "239742"
}

CACHE_LEGACY = "cftc_combined_v3.csv"
CACHE_TFF = "cftc_tff_v2.csv"
CACHE_DISAGG = "cftc_disagg_v1.csv"
CACHE_EXPIRY = 3600 * 24

def fetch_legacy_data():
    if os.path.exists(CACHE_LEGACY):
        mtime = os.path.getmtime(CACHE_LEGACY)
        if datetime.datetime.now().timestamp() - mtime < CACHE_EXPIRY:
             try:
                 return pd.read_csv(CACHE_LEGACY, dtype={'cftc_code': str}, parse_dates=['date'], low_memory=False)
             except: pass

    print("Downloading CoT Legacy Data...")
    dfs = []
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    rename_map = {
        0: 'market_name', 2: 'date', 3: 'cftc_code', 7: 'open_interest',
        8: 'noncomm_long', 9: 'noncomm_short',
        11: 'comm_long', 12: 'comm_short',
        15: 'nonrep_long', 16: 'nonrep_short'
    }

    # 1. Current
    try:
        r = requests.get(URL_LEGACY_CURRENT, headers=headers)
        if r.status_code == 404:
             fallback = "https://www.cftc.gov/dea/newcot/deafut.txt"
             print(f"Legacy Current 404, fallback: {fallback}")
             r = requests.get(fallback, headers=headers)
        r.raise_for_status()
        df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
        df = df.rename(columns=rename_map)
        dfs.append(df[[c for c in df.columns if c in rename_map.values()]])
    except Exception as e:
        print(f"Error fetching Legacy Current: {e}")

    # 2. History
    for year in YEARS_HISTORY:
        url = URL_LEGACY_HIST.format(year)
        try:
            r = requests.get(url, headers=headers)
            if r.status_code == 404:
                # Fallback to deafut
                fallback = f"https://www.cftc.gov/files/dea/history/deafut{year}.zip"
                r = requests.get(fallback, headers=headers)
            
            if r.status_code == 404: continue
            r.raise_for_status()
            
            with zipfile.ZipFile(io.BytesIO(r.content)) as z:
                with z.open(z.namelist()[0]) as f:
                    df = pd.read_csv(f, header=None, low_memory=False)
                    df = df.rename(columns=rename_map)
                    dfs.append(df[[c for c in df.columns if c in rename_map.values()]])
        except Exception as e:
            print(f"Error fetching Legacy Hist {year}: {e}")

    if not dfs: return pd.DataFrame()
    final = pd.concat(dfs, ignore_index=True)
    final['date'] = pd.to_datetime(final['date'], errors='coerce')
    final['cftc_code'] = final['cftc_code'].astype(str).str.strip()
    final.to_csv(CACHE_LEGACY, index=False)
    return final

def fetch_tff_data():
    if os.path.exists(CACHE_TFF):
        mtime = os.path.getmtime(CACHE_TFF)
        if datetime.datetime.now().timestamp() - mtime < CACHE_EXPIRY:
             try:
                 return pd.read_csv(CACHE_TFF, dtype={'cftc_code': str}, parse_dates=['date'], low_memory=False)
             except: pass

    print("Downloading CoT TFF Data...")
    dfs = []
    headers = {'User-Agent': 'Mozilla/5.0'}

    rename_map = {
        0: 'market_name', 2: 'date', 3: 'cftc_code',
        7: 'open_interest',
        8: 'dealer_long', 9: 'dealer_short',
        11: 'asset_long', 12: 'asset_short',
        14: 'lev_long', 15: 'lev_short',
        17: 'other_long', 18: 'other_short',
        20: 'nonrep_long', 21: 'nonrep_short'
    }

    # 1. Current URLs to try
    current_urls = [
        "https://www.cftc.gov/dea/newcot/FinFutWk.txt",
        "https://www.cftc.gov/dea/newcot/FinFut.txt",
        "https://www.cftc.gov/dea/newcot/fin_fut.txt"
    ]
    
    current_found = False
    for url in current_urls:
        try:
            print(f"Trying TFF Current: {url}")
            r = requests.get(url, headers=headers)
            if r.status_code == 200:
                df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
                df = df.rename(columns=rename_map)
                wanted = [c for c in df.columns if c in rename_map.values()]
                dfs.append(df[wanted])
                current_found = True
                print("Success")
                break
        except Exception as e:
            print(f"Err {url}: {e}")
            
    if not current_found:
        print("TFF Current not found in any standard URL.")

    # 2. History
    for year in YEARS_HISTORY:
        urls_hist = [
            f"https://www.cftc.gov/files/dea/history/fin_fut_txt_{year}.zip",
            f"https://www.cftc.gov/files/dea/history/fut_fin_txt_{year}.zip"
        ]
        
        hist_found = False
        for url in urls_hist:
            try:
                r = requests.get(url, headers=headers)
                if r.status_code == 200:
                    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
                        with z.open(z.namelist()[0]) as f:
                            df = pd.read_csv(f, header=None, low_memory=False)
                            df = df.rename(columns=rename_map)
                            wanted = [c for c in df.columns if c in rename_map.values()]
                            dfs.append(df[wanted])
                    hist_found = True
                    break
            except Exception as e:
                # print(f"Err TFF Hist {year}: {e}")
                pass
        
        if not hist_found:
            pass

    if not dfs: return pd.DataFrame()
    final = pd.concat(dfs, ignore_index=True)
    final['date'] = pd.to_datetime(final['date'], errors='coerce')
    final['cftc_code'] = final['cftc_code'].astype(str).str.strip()
    
    final.to_csv(CACHE_TFF, index=False)
    return final

def fetch_disagg_data():
    if os.path.exists(CACHE_DISAGG):
        mtime = os.path.getmtime(CACHE_DISAGG)
        if datetime.datetime.now().timestamp() - mtime < CACHE_EXPIRY:
             try:
                 return pd.read_csv(CACHE_DISAGG, dtype={'cftc_code': str}, parse_dates=['date'], low_memory=False)
             except: pass

    print("Downloading CoT Disaggregated Data...")
    dfs = []
    headers = {'User-Agent': 'Mozilla/5.0'}

    rename_map = {
        0: 'market_name', 2: 'date', 3: 'cftc_code',
        7: 'open_interest',
        8: 'pm_long', 9: 'pm_short', # Producer/Merchant
        10: 'swap_long', 11: 'swap_short', # Swap Dealers
        13: 'mm_long', 14: 'mm_short', # Managed Money
        16: 'other_long', 17: 'other_short',
        19: 'nonrep_long', 20: 'nonrep_short' # Approx index, might need verifying
    }
    # Note on Indices: 
    # Swap Spreading is usually 12?
    # MM Spreading usually 15?
    # Other Spreading usually 18?
    # So 16 for Other Long is correct if (13,14,15) are MM.
    # NonReportable starts after Other Spread (18) + maybe Total reportable? No. 
    # Standard Disagg: 
    # ... Other Long(16), Other Short(17), Other Spread(18), Total Reportable(19?? No)
    # Actually NonReportable Long (19) ? Let's Assume 19/20 for NonRep.

    # 1. Current
    # f_disagg.txt (Futures Only)
    current_urls = [
         "https://www.cftc.gov/dea/newcot/f_disagg.txt",
         "https://www.cftc.gov/dea/newcot/c_disagg.txt" # Combined fallback
    ]
    
    current_found = False
    for url in current_urls:
        try:
            print(f"Trying Disagg Current: {url}")
            r = requests.get(url, headers=headers)
            if r.status_code == 200:
                df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
                # Map columns
                # We only map what we need
                # If indices are shifted in c_disagg (Combined), this might break. 
                # Ideally check file type. Assuming f_disagg works.
                df_mapped = df.rename(columns=rename_map)
                wanted = [c for c in df_mapped.columns if c in rename_map.values()]
                dfs.append(df_mapped[wanted])
                current_found = True
                print("Success")
                break
        except Exception as e:
            print(f"Err {url}: {e}")
            
    # 2. History
    for year in YEARS_HISTORY:
        # https://www.cftc.gov/files/dea/history/fut_disagg_txt_2024.zip
        urls_hist = [
            f"https://www.cftc.gov/files/dea/history/fut_disagg_txt_{year}.zip"
        ]
        
        for url in urls_hist:
            try:
                r = requests.get(url, headers=headers)
                if r.status_code == 200:
                    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
                        with z.open(z.namelist()[0]) as f:
                            df = pd.read_csv(f, header=None, low_memory=False)
                            df = df.rename(columns=rename_map)
                            wanted = [c for c in df.columns if c in rename_map.values()]
                            dfs.append(df[wanted])
                    break
            except: pass

    if not dfs: return pd.DataFrame()
    final = pd.concat(dfs, ignore_index=True)
    final['date'] = pd.to_datetime(final['date'], errors='coerce')
    final['cftc_code'] = final['cftc_code'].astype(str).str.strip()
    
    final.to_csv(CACHE_DISAGG, index=False)
    return final

def calc_index_col(series, weeks=26):
        s = series.astype(float)
        rmin = s.rolling(window=weeks).min()
        rmax = s.rolling(window=weeks).max()
        denom = rmax - rmin
        denom = denom.replace(0, np.nan) 
        idx = 100 * (s - rmin) / denom 
        # Standard 0-100 logic
        return idx
        
def get_cot_data(ticker, report_type='legacy', lookback_weeks=26):
    print(f"DEBUG: get_cot_data {ticker} type={report_type} lookback={lookback_weeks}")
    code = TICKER_TO_CFTC.get(ticker)
    if not code: return []

    if report_type == 'tff':
        df = fetch_tff_data()
        cols_num = ['dealer_long', 'dealer_short', 'asset_long', 'asset_short', 
                    'lev_long', 'lev_short', 'other_long', 'other_short', 
                    'nonrep_long', 'nonrep_short', 'open_interest']
    elif report_type == 'disaggregated':
        df = fetch_disagg_data()
        cols_num = ['pm_long', 'pm_short', 'swap_long', 'swap_short', 
                    'mm_long', 'mm_short', 'other_long', 'other_short',
                    'nonrep_long', 'nonrep_short', 'open_interest']
    else:
        df = fetch_legacy_data()
        cols_num = ['comm_long', 'comm_short', 'noncomm_long', 'noncomm_short', 
                    'nonrep_long', 'nonrep_short', 'open_interest']

    if df.empty: return []

    df['cftc_code'] = df['cftc_code'].astype(str).str.strip()
    subset = df[df['cftc_code'] == code]
    if subset.empty:
        short_code = code.lstrip('0')
        subset = df[df['cftc_code'] == short_code]
    
    if subset.empty: return []
    subset = subset.sort_values('date')

    for c in cols_num:
        if c in subset.columns:
            subset[c] = pd.to_numeric(subset[c], errors='coerce').fillna(0)
    
    out = []
    
    # Ensure lookback_weeks is integer
    try:
        lb = int(lookback_weeks)
    except:
        lb = 26

    if report_type == 'tff':
        # Calculate Nets
        subset['dealer_net'] = subset['dealer_long'] - subset['dealer_short']
        subset['asset_net'] = subset['asset_long'] - subset['asset_short']
        subset['lev_net'] = subset['lev_long'] - subset['lev_short']
        
        # Calculate Index
        subset['dealer_index'] = calc_index_col(subset['dealer_net'], weeks=lb)
        subset['asset_index'] = calc_index_col(subset['asset_net'], weeks=lb)
        subset['lev_index'] = calc_index_col(subset['lev_net'], weeks=lb)
        
        for _, row in subset.iterrows():
             try:
                def gv(v): return float(v) if pd.notna(v) else None
                out.append({
                    "date": row['date'].strftime("%Y-%m-%d"),
                    "open_interest": int(row.get('open_interest', 0)),
                    "dealer_net": int(row['dealer_net']),
                    "dealer_index": gv(row['dealer_index']),
                    "asset_net": int(row['asset_net']),
                    "asset_index": gv(row['asset_index']),
                    "lev_net": int(row['lev_net']),
                    "lev_index": gv(row['lev_index'])
                })
             except: continue
    
    elif report_type == 'disaggregated':
        # Nets
        subset['pm_net'] = subset['pm_long'] - subset['pm_short']
        subset['swap_net'] = subset['swap_long'] - subset['swap_short']
        subset['mm_net'] = subset['mm_long'] - subset['mm_short']
        
        # Index
        subset['pm_index'] = calc_index_col(subset['pm_net'], weeks=lb)
        subset['swap_index'] = calc_index_col(subset['swap_net'], weeks=lb)
        subset['mm_index'] = calc_index_col(subset['mm_net'], weeks=lb)
        
        for _, row in subset.iterrows():
             try:
                def gv(v): return float(v) if pd.notna(v) else None
                out.append({
                    "date": row['date'].strftime("%Y-%m-%d"),
                    "open_interest": int(row.get('open_interest', 0)),
                    "pm_net": int(row['pm_net']),
                    "pm_index": gv(row['pm_index']),
                    "swap_net": int(row['swap_net']),
                    "swap_index": gv(row['swap_index']),
                    "mm_net": int(row['mm_net']),
                    "mm_index": gv(row['mm_index'])
                })
             except: continue

    else:
        # Legacy
        subset['commercial_net'] = subset['comm_long'] - subset['comm_short']
        subset['large_spec_net'] = subset['noncomm_long'] - subset['noncomm_short']
        subset['small_spec_net'] = subset['nonrep_long'] - subset['nonrep_short']
        
        subset['commercial_index'] = calc_index_col(subset['commercial_net'], weeks=lb)
        subset['large_spec_index'] = calc_index_col(subset['large_spec_net'], weeks=lb)
        subset['small_spec_index'] = calc_index_col(subset['small_spec_net'], weeks=lb)
        
        for _, row in subset.iterrows():
             try:
                def gv(v): return float(v) if pd.notna(v) else None
                out.append({
                    "date": row['date'].strftime("%Y-%m-%d"),
                    "open_interest": int(row['open_interest']),
                    "commercial_net": int(row['commercial_net']),
                    "large_spec_net": int(row['large_spec_net']),
                    "small_spec_net": int(row['small_spec_net']),
                    "commercial_index": gv(row['commercial_index']),
                    "large_spec_index": gv(row['large_spec_index']),
                    "small_spec_index": gv(row['small_spec_index'])
                })
             except: continue

    return out

if __name__ == "__main__":
    pass
    # fetch_tff_data()
