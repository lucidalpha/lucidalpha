
import requests
import io

url = "https://www.cftc.gov/dea/newcot/FinFutwk.txt"
headers = {'User-Agent': 'Mozilla/5.0'}

print(f"Fetching {url}...")
try:
    r = requests.get(url, headers=headers)
    target_code = "096742" # British Pound
    
    if r.status_code == 200:
        lines = r.text.splitlines()
        print(f"Total lines: {len(lines)}")
        
        found = False
        for line in lines:
            if target_code in line:
                parts = [p.strip() for p in line.split(',')]
                print("\n=== MATCH FOUND ===")
                print(f"Raw Line: {line[:100]}...")
                print("Indices and Values:")
                for i, p in enumerate(parts):
                    print(f"{i}: {p}")
                found = True
                break
        
        if not found:
            print(f"Code {target_code} not found in file.")
            # Print first line just in case
            if lines:
                print("First line:", lines[0])
    else:
        print(f"Status: {r.status_code}")

except Exception as e:
    print(f"Error: {e}")
