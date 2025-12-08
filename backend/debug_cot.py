
from cot_service import get_cot_data, fetch_data
import pandas as pd
import traceback

print("Basic Test DX=F ...")
try:
    data = get_cot_data("DX=F")
    print(f"Items: {len(data)}")
    if data:
        print("First Item:", data[0])
        print("Last Item:", data[-1])
    else:
        print("No data found for DX=F")
except Exception:
    traceback.print_exc()

