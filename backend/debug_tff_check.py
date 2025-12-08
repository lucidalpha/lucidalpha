import pandas as pd
import requests
import io

def check_tff_for_dollar():
    url = "https://www.cftc.gov/dea/newcot/FinFutwk.txt"
    print(f"Downloading {url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        
        # TFF columns are many, but index 3 is usually CFTC Code
        print("Parsing...")
        df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
        
        # CFTC Code is column 3
        cftc_codes = df[3].astype(str).str.strip().tolist()
        
        # Check for Dollar variants
        # 098662 is standard USD Index
        target = "098662"
        short_target = "98662"
        
        print(f"Total rows: {len(df)}")
        print(f"Unique codes: {len(set(cftc_codes))}")
        
        if target in cftc_codes:
            print(f"SUCCESS: Found {target} (USD Index) in TFF report!")
            # Print a sample row
            row = df[df[3].astype(str).str.strip() == target].iloc[0]
            print(row.values)
        elif short_target in cftc_codes:
            print(f"SUCCESS: Found {short_target} (Short code USD Index)!");
        else:
            print(f"FAILURE: {target} NOT found in TFF.")
            print("First 10 codes found:", cftc_codes[:10])
            
            # Search for anything looking like USD
            names = df[0].astype(str).tolist()
            for i, name in enumerate(names):
                if "DOLLAR" in name.upper() and "INDEX" in name.upper():
                    print(f"Found name match at index {i}: {name} -> Code: {df.iloc[i, 3]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tff_for_dollar()
