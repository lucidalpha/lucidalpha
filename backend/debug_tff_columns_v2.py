
import requests

urls = [
    "https://www.cftc.gov/dea/newcot/FinFutwk.txt",
    "https://www.cftc.gov/dea/newcot/FinFut.txt",
    "https://www.cftc.gov/dea/newcot/fin_fut.txt"
]
headers = {'User-Agent': 'Mozilla/5.0'}

target_code = "096742" # British Pound

for url in urls:
    print(f"Trying {url}...")
    try:
        r = requests.get(url, headers=headers)
        if r.status_code == 200:
            print(f"SUCCESS: {url}")
            lines = r.text.splitlines()
            for line in lines:
                if target_code in line:
                    parts = [p.strip() for p in line.split(',')]
                    print("\n=== MATCH FOUND ===")
                    print(f"Line: {line[:50]}...")
                    for i, p in enumerate(parts):
                        print(f"{i}: {p}")
                    # Found, exit
                    exit()
        else:
            print(f"Status: {r.status_code}")
    except Exception as e:
        print(f"Error: {e}")
