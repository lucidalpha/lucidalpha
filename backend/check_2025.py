
import requests

year = 2025
url = f"https://www.cftc.gov/files/dea/history/deacot{year}.zip"
headers = {'User-Agent': 'Mozilla/5.0'}

print(f"Checking {url}...")
r = requests.head(url, headers=headers)
print(f"Status: {r.status_code}")

url_fut = f"https://www.cftc.gov/files/dea/history/deafut{year}.zip"
print(f"Checking {url_fut}...")
r2 = requests.head(url_fut, headers=headers)
print(f"Status: {r2.status_code}")
