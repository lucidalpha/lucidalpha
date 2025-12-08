import pandas as pd
import requests
import io

def check_tff_alt_url():
    # Try alternative file name
    url = "https://www.cftc.gov/dea/newcot/FinFut.txt" 
    # Sometimes it is fin_fut.txt or FinFut.txt
    
    print(f"Downloading {url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        r = requests.get(url, headers=headers)
        if r.status_code == 404:
             print("404 on FinFut.txt too.")
             # Last resort try
             url = "https://www.cftc.gov/dea/newcot/f_year.txt" # Wait, no.
             return

        r.raise_for_status()
        
        print("Parsing...")
        df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
        
        cftc_codes = df[3].astype(str).str.strip().tolist()
        target = "098662"
        
        if target in cftc_codes:
            print(f"SUCCESS: Found {target} (USD Index) in {url}!")
        else:
            print(f"FAILURE: {target} NOT found in {url}.")
            # Name finding
            names = df[0].astype(str).tolist()
            for i, name in enumerate(names):
                 if "DOLLAR" in name.upper() and "INDEX" in name.upper():
                    print(f"Found name match: {name} -> Code: {df.iloc[i, 3]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tff_alt_url()
