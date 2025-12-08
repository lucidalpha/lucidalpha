import requests
import io
import zipfile

patterns = [
    "https://www.cftc.gov/files/dea/history/deacot{}.zip",
    "https://www.cftc.gov/files/dea/history/fut_disagg_txt_{}.zip",
    "https://www.cftc.gov/files/dea/history/deafut_txt_{}.zip"
]

year = 2023

headers = {'User-Agent': 'Mozilla/5.0'}

for p in patterns:
    url = p.format(year)
    print(f"\nTesting: {url}")
    try:
        r = requests.get(url, headers=headers, timeout=5)
        print(f"Status: {r.status_code}")
    except Exception as e:
        print(f"Error: {e}")
