import requests

try:
    print("Testing API Endpoint http://localhost:8000/cot/ZW=F ...")
    r = requests.get("http://localhost:8000/cot/ZW=F")
    print(f"Status Code: {r.status_code}")
    data = r.json()
    print("Keys:", data.keys())
    if "data" in data:
        print(f"Data Length: {len(data['data'])}")
        if len(data['data']) > 0:
            print("First Item:", data['data'][0])
    else:
        print("Response:", data)
except Exception as e:
    print(f"Error: {e}")
