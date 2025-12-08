
import requests

years = [2024]
base_hist = "https://www.cftc.gov/files/dea/history/"
# Potential patterns for TFF History
patterns = [
    "fin_fut_txt_{}.zip",
    "FinFut{}.zip",
    "ff{}.zip",
    "fut_fin_txt_{}.zip"
]

# Current data patterns
base_curr = "https://www.cftc.gov/dea/newcot/"
curr_patterns = [
    "FinFut.txt",
    "FinFutwk.txt",
    "ff_fut.txt"
]

headers = {'User-Agent': 'Mozilla/5.0'}

print("Checking History URLs...")
for p in patterns:
    url = base_hist + p.format(2024)
    try:
        r = requests.head(url, headers=headers)
        print(f"{url} -> {r.status_code}")
    except:
        print(f"{url} -> Error")

print("\nChecking Current URLs...")
for p in curr_patterns:
    url = base_curr + p
    try:
        r = requests.head(url, headers=headers)
        print(f"{url} -> {r.status_code}")
    except:
        print(f"{url} -> Error")
