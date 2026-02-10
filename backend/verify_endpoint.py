
import requests

try:
    r = requests.get("http://127.0.0.1:8000/institutional/funds")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Type: {type(data)}")
        if isinstance(data, list):
            print(f"Count: {len(data)}")
            if len(data) > 0:
                print("First item:", data[0])
        else:
            print("Data:", data)
    else:
        print("Text:", r.text)
except Exception as e:
    print(f"Error: {e}")
