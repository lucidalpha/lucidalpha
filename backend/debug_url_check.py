
import requests
import re

cik = "0001037389"
acc = "0001037389-25-000064"
acc_clean = acc.replace('-', '')
base_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{acc_clean}"

headers = {"User-Agent": "LucidAlphaResearch contact@lucidalpha.com", "Accept-Encoding": "gzip, deflate"}
index_url = f"{base_url}/{acc}-index.html"

print(f"Checking {index_url}...")
try:
    r = requests.get(index_url, headers=headers)
    if r.status_code == 200:
        xmls = re.findall(r'href="([^"]+\.xml)"', r.text)
        print("XML Links found:", xmls)
    else:
        print(f"Index page failed: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")
