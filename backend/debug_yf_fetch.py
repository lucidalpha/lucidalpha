
import sys
import os
sys.path.append(os.getcwd())
from analysis import fetch_ticker_data
import traceback

try:
    print("Fetching data for AAPL...")
    df = fetch_ticker_data("AAPL")
    print("Fetch success")
    if df is not None:
        print(df.head())
    else:
        print("df is None")
except Exception as e:
    print("Fetch Failed")
    traceback.print_exc()
