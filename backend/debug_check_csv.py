import pandas as pd
import sys

output_file = r'x:\Saisonalitäten Auswertung\backend\debug_output.txt'
file_path = r'x:\Saisonalitäten Auswertung\uploads\NYMEX_DL_NG1!, 1D_106ee.csv'

with open(output_file, 'w', encoding='utf-8') as out:
    try:
        out.write(f"Reading {file_path}\n")
        # Read as text first to show raw lines
        with open(file_path, 'r') as f:
            lines = f.readlines()
            out.write(f"Total lines: {len(lines)}\n")
            out.write("--- Last 3 lines (RAW REPR) ---\n")
            for line in lines[-3:]:
                out.write(repr(line.strip()) + "\n")
                
        # Try parsing with pandas
        out.write("\n--- Pandas Interpretation of last row ---\n")
        df = pd.read_csv(file_path)
        out.write(str(df.iloc[-1]) + "\n")
        
        # Explicit check for NaN
        out.write(f"\nIs there any NaN in the last row? {df.iloc[-1].isna().any()}\n")
        
    except Exception as e:
        out.write(f"Error: {e}\n")
