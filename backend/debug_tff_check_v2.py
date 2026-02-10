
import pandas as pd
from cot_service import fetch_tff_data, TICKER_TO_CFTC

def debug_tff():
    with open("debug_tff_results.txt", "w", encoding="utf-8") as f:
        f.write("Fetching TFF Data...\n")
        df = fetch_tff_data()
        
        if df.empty:
            f.write("TFF Data is empty!\n")
            return

        f.write(f"Loaded TFF Data: {len(df)} rows\n")
        f.write(f"Columns: {df.columns.tolist()}\n")
        
        # Get unique codes and names
        unique_assets = df[['cftc_code', 'market_name']].drop_duplicates().sort_values('market_name')
        
        # f.write("\n--- Unique TFF Assets (First 50) ---\n")
        # for _, row in unique_assets.head(50).iterrows():
        #     f.write(f"Code: {row['cftc_code']} | Name: {row['market_name']}\n")
            
        f.write("\n--- Searching for Currencies ---\n")
        keywords = ["EURO", "DOLLAR", "POUND", "YEN", "CANADIAN", "SWISS", "AUSTRALIAN", "ZEALAND", "MXN", "REAL"]
        
        found_codes = {}
        
        for kw in keywords:
            f.write(f"\nSearching for '{kw}':\n")
            matches = unique_assets[unique_assets['market_name'].astype(str).str.contains(kw, case=False, na=False)]
            for _, row in matches.iterrows():
                f.write(f"  Found: Code='{row['cftc_code']}' Name='{row['market_name']}'\n")
                found_codes[kw] = row['cftc_code']

        f.write("\n--- Verifying Configured Mappings ---\n")
        currency_tickers = ["6E=F", "6A=F", "6B=F", "6C=F", "6J=F", "6S=F", "6N=F", "DX=F"]
        
        for ticker in currency_tickers:
            config_code = TICKER_TO_CFTC.get(ticker)
            f.write(f"Ticker: {ticker} -> Config Code: {config_code}\n")
            
            # Check if this code exists in TFF
            exists = df[df['cftc_code'] == config_code]
            if not exists.empty:
                name = exists.iloc[0]['market_name']
                f.write(f"  ✅ Found in TFF Data as: {name}\n")
            else:
                f.write(f"  ❌ NOT FOUND in TFF Data directly.\n")
                # Try strip leading zero
                if config_code and config_code.startswith('0'):
                    short_code = config_code.lstrip('0')
                    exists_short = df[df['cftc_code'] == short_code]
                    if not exists_short.empty:
                         name = exists_short.iloc[0]['market_name']
                         f.write(f"  ✅ Found with stripped zero: {short_code} ({name})\n")
                    else:
                         f.write(f"  ❌ Not found even with stripped zero.\n")

if __name__ == "__main__":
    debug_tff()
