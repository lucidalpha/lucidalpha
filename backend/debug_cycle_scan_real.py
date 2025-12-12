
import traceback
import sys
import os

# Ensure backend path is in sys.path
sys.path.append(os.getcwd())

from analysis import fetch_ticker_data
from cycle_analysis import perform_cycle_analysis

ticker = "AAPL"
print(f"Fetching data for {ticker}...")
try:
    df = fetch_ticker_data(ticker, period="5y")
    if df is None or df.empty:
        print("DF is empty/none")
        sys.exit(1)
        
    print(f"Data columns: {df.columns}")
    print(f"Data head: {df.head()}")
    
    print("Running cycle analysis...")
    results = perform_cycle_analysis(df)
    print("Success!")
    print("Cycles found:", len(results.get('cycles', [])))
    
    import json
    # Try to serialize
    try:
        json_str = json.dumps(results)
        print("JSON Serialization successful")
    except TypeError as e:
        print(f"JSON Serialization FAILED: {e}")
        # print details
        # traverse to find bad type?
        pass

except Exception:
    traceback.print_exc()
