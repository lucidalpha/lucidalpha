
from screener import fetch_dow_jones, fetch_nasdaq_100, fetch_dax
import json
import os

def test_fetchers():
    print("Testing Dow fetcher...")
    dow = fetch_dow_jones()
    print(f"Dow results type: {type(dow)}")
    if dow:
        print(f"First item: {dow[0]}")
        print(f"Type of first item: {type(dow[0])}")
    else:
        print("Dow fetch returned empty.")

    print("\nTesting Nasdaq fetcher...")
    nas = fetch_nasdaq_100()
    if nas:
        print(f"First item: {nas[0]}")
    else:
        print("Nasdaq fetch returned empty.")
        
    print("\nTesting DAX fetcher...")
    dax = fetch_dax()
    if dax:
        print(f"First item: {dax[0]}")
    else:
        print("DAX fetch returned empty.")

if __name__ == "__main__":
    test_fetchers()
