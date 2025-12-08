import pandas as pd
import requests
import io

def check_disagg_cols():
    url = "https://www.cftc.gov/dea/newcot/f_disagg.txt"
    print(f"Downloading {url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        
        # Read first few lines
        # The file doesn't have headers usually.
        df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
        
        print("Columns count:", len(df.columns))
        # Print a row to guess
        print("Sample Row values (first 25 cols):")
        print(df.iloc[0, :25].values)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_disagg_cols()
