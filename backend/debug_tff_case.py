import pandas as pd
import requests
import io

def check_tff_case():
    # Correct Casing based on IWR success
    url = "https://www.cftc.gov/dea/newcot/FinFutWk.txt"
    print(f"Downloading {url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        
        print("Parsing...")
        df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
        
        cftc_codes = df[3].astype(str).str.strip().tolist()
        target = "098662"
        
        if target in cftc_codes:
            print(f"SUCCESS: Found {target} (USD Index) in {url}!")
        else:
            print(f"FAILURE: {target} NOT found in {url}.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tff_case()
