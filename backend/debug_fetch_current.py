
import pandas as pd
import requests
import io

URL_CURRENT_TXT = "https://www.cftc.gov/dea/newcot/deacot.txt"
headers = {'User-Agent': 'Mozilla/5.0'}

print(f"Downloading {URL_CURRENT_TXT}...")
try:
    r = requests.get(URL_CURRENT_TXT, headers=headers)
    r.raise_for_status()
    print("Download success. Parsing...")
    
    # Check first few lines
    print("First 3 lines:")
    print(r.text[:300])
    
    df = pd.read_csv(io.StringIO(r.text), header=None, low_memory=False)
    
    # 0: Market, 2: Date
    df['date'] = pd.to_datetime(df[2], errors='coerce')
    df = df.sort_values('date')
    
    print("\nDataFrame Info:")
    print(f"Total Rows: {len(df)}")
    print(f"Start Date: {df['date'].min()}")
    print(f"End Date: {df['date'].max()}")
    
    # Check for DX data (098662)
    dx = df[df[3].astype(str).str.contains("098662")]
    print(f"\nDX Entries: {len(dx)}")
    if not dx.empty:
        print(dx[[0, 2]].head())
        print(dx[[0, 2]].tail())
        
except Exception as e:
    print(f"Error: {e}")
