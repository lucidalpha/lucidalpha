from analysis import analyze_seasonality
import os
import pandas as pd

# Path to the uploaded file
file_path = r"x:\Saisonalitäten Auswertung\backend\uploads\CME_DL_6B1!, 1D_b6c79.csv"

print(f"Testing analysis on: {file_path}")

if not os.path.exists(file_path):
    print("File not found!")
else:
    try:
        # Run analysis
        results = analyze_seasonality(file_path)
        print(f"Analysis complete. Found {len(results)} patterns.")
        for p in results[:5]:
            print(p)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
