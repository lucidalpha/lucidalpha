
import pandas as pd
import numpy as np
import traceback
from cycle_analysis import perform_cycle_analysis

# Mock Data
dates = pd.date_range(start="2020-01-01", periods=1000, freq='D')
values = np.linspace(100, 200, 1000) + np.sin(np.linspace(0, 50, 1000)) * 10 + np.random.normal(0, 2, 1000)
df = pd.DataFrame({'Date': dates, 'Close': values})

print("Running cycle analysis...")
try:
    results = perform_cycle_analysis(df, close_col='Close')
    print("Success!")
    print("Cycles found:", len(results.get('cycles', [])))
    if results.get('cycles'):
        print("Top Cycle:", results['cycles'][0])
except Exception:
    traceback.print_exc()
