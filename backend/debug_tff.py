
import requests
import zipfile
import io
import pandas as pd

url_hist = "https://www.cftc.gov/files/dea/history/fin_fut_txt_2024.zip"
print(f"Fetching {url_hist}...")
r = requests.get(url_hist, headers={'User-Agent': 'Mozilla/5.0'})
print(f"Status: {r.status_code}")

if r.status_code == 200:
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        print("Files:", z.namelist())
        with z.open(z.namelist()[0]) as f:
            # Read first line to see headers or just infer
            # Cftc usually has no headers in these files, or it does?
            # We'll read csv
            df = pd.read_csv(f, header=None, nrows=5)
            print("Shape:", df.shape)
            print("First row:", df.iloc[0].tolist())
            
# Check current guesses again
urls = [
    "https://www.cftc.gov/dea/newcot/FinFutwk.txt", 
    "https://www.cftc.gov/dea/newcot/fin_fut.txt",
    "https://www.cftc.gov/dea/newcot/FinFut.txt"
]
for u in urls:
    try:
        r2 = requests.head(u, headers={'User-Agent': 'Mozilla/5.0'})
        print(f"{u} -> {r2.status_code}")
    except: pass
