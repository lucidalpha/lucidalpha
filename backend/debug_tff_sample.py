
import requests
import zipfile
import io
import pandas as pd

# Try 2023 to be safe
url = "https://www.cftc.gov/files/dea/history/fin_fut_txt_2023.zip"
headers = {'User-Agent': 'Mozilla/5.0'}

print(f"Trying {url}...")
r = requests.get(url, headers=headers)
print(f"Status: {r.status_code}")

if r.status_code == 200:
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        print("Files:", z.namelist())
        with z.open(z.namelist()[0]) as f:
            # Read line by line
            line = f.readline().decode('utf-8')
            print("Line 1:", line[:100])
            line2 = f.readline().decode('utf-8')
            print("Line 2:", line2[:100])
            
            # Split
            parts = line.split(',')
            print("Parts count:", len(parts))
            # Preview parts
            for i, p in enumerate(parts[:25]):
                print(f"{i}: {p.strip()}")
                
# Current URL Check
print("Checking Current...")
url_curr = "https://www.cftc.gov/dea/newcot/FinFutwk.txt"
r2 = requests.get(url_curr, headers=headers)
print(f"Current Status: {r2.status_code}")
if r2.status_code == 200:
    print("Current Line 1:", r2.text.splitlines()[0][:100])
