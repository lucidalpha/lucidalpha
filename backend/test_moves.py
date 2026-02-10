
import sys
import os
import pandas as pd
from institutional_service import get_largest_moves

try:
    print("Testing get_largest_moves for AAPL...")
    result = get_largest_moves("AAPL")
    
    purchases = result.get('purchases', [])
    if purchases:
        first = purchases[0]
        print(f"First purchase Avg Price: {first.get('avg_price')}")
        if first.get('avg_price') > 0:
            print("SUCCESS: Price is valid.")
        else:
            print("FAILURE: Price is still 0.")
    else:
        print("No purchases found to test.")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
