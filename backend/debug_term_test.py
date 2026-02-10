
import requests

def test_endpoints():
    # 1. Assets
    try:
        r = requests.get("http://127.0.0.1:8000/term_structure/assets")
        print(f"Assets Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Assets Count: {len(r.json())}")
            # print(r.json()[:2])
    except Exception as e:
        print(f"Assets Error: {e}")

    # 2. Analyze Gold
    try:
        r = requests.post("http://127.0.0.1:8000/term_structure/analyze", json={"ticker": "GC=F"})
        print(f"Analyze Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if 'data' in data:
                print(f"Term Structure Points: {len(data['data'])}")
                if len(data['data']) > 0:
                    print(f"First Date: {data['data'][0]['date']}")
                    print(f"Curve Points: {len(data['data'][0]['curve'])}")
            else:
                print("No data field in response")
        else:
            print(r.text)
    except Exception as e:
        print(f"Analyze Error: {e}")

if __name__ == "__main__":
    test_endpoints()
